const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
app.use(express.json());

// FIXED: Explicit CORS configuration to handle Preflight (OPTIONS) requests
app.use(cors({
    origin: 'http://localhost:3000', // Allow your React app
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const dbConfig = {
    server: 'localhost', 
    database: 'Amble',
    options: {
        encrypt: true, 
        trustServerCertificate: true,
        integratedSecurity: true 
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

// GLOBAL CONNECTION POOL
const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('Connected to SQL Server: Amble');
        return pool;
    })
    .catch(err => {
        console.error('Database Connection Failed: ', err);
        process.exit(1);
    });

// 1. Fetch Suggestion
app.get('/api/meals/suggest', async (req, res) => {
    const { diet } = req.query;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('DietCategory', sql.NVarChar, diet)
            .execute('dbo.usp_GetRandomMealByDiet');
        
        if (result.recordsets[0].length > 0) {
            res.json({
                ...result.recordsets[0][0],
                ingredients: result.recordsets[1]
            });
        } else {
            res.status(404).json({ message: 'No meals found' });
        }
    } catch (err) { res.status(500).send(err.message); }
});

// 2. Fetch User Preference (Fixed 404 for User 2)
app.get('/api/user/preference/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('UserID', sql.Int, req.params.id)
            .execute('dbo.usp_GetUserDietPreference');
        
        // Return a default if Dwayne doesn't have a record yet
        res.json(result.recordset[0] || { ActiveDietName: 'Keto' });
    } catch (err) { res.status(500).send(err.message); }
});

// 3. Save User Preference
app.post('/api/user/preference', async (req, res) => {
    const { userId, dietName } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('UserID', sql.Int, userId)
            .input('DietName', sql.NVarChar, dietName)
            .execute('dbo.usp_SaveUserDietPreference');
        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

// 4. Save Accepted Meal Plan (Fixed 404 from Dashboard)
app.post('/api/meal-plans/add', async (req, res) => {
    const { userId, mealId, plannedDate, mealTime } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('UserID', sql.Int, userId)
            .input('MealID', sql.Int, mealId)
            .input('PlannedDate', sql.Date, plannedDate)
            .input('MealTime', sql.NVarChar, mealTime)
            .query(`INSERT INTO MealPlans (UserID, MealID, PlannedDate, MealTime, Status) 
                    VALUES (@UserID, @MealID, @PlannedDate, @MealTime, 'Accepted')`);
        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

// 5. Fetch Diet Plans
app.get('/api/diet-plans', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('dbo.usp_GetDietPlans');
        res.json(result.recordset);
    } catch (err) { res.status(500).send(err.message); }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));