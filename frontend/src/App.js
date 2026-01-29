
import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import VitalsBar from './components/VitalsBar';
import GroceryList from './components/GroceryList';
import './components/Dashboard.css'; 
import './App.css';

function App() {
  const [time, setTime] = useState(new Date());
  const [dietMode, setDietMode] = useState('Keto'); 
  const [dietList, setDietList] = useState([]);
  const [dailyStats, setDailyStats] = useState({ calories: 0, protein: 0, water: 1200 });
  const [ingredients, setIngredients] = useState([]);

  // Load Preferences and Diet List
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    const initializeAppData = async () => {
      try {
        // Fetch All Diet Plans from Local SQL Server
        const dietRes = await fetch('http://localhost:5000/api/diet-plans');
        const diets = await dietRes.json();
        
        // Ensure we handle both array of strings and array of objects
        const formattedDiets = Array.isArray(diets) 
          ? diets.map(d => typeof d === 'string' ? d : d.DietName)
          : [];
          
        setDietList(formattedDiets);

        // DATA_01: Target UserID 2 (Dwayne) instead of 1
        const prefRes = await fetch('http://localhost:5000/api/user/preference/2');
        if (prefRes.ok) {
          const pref = await prefRes.json();
          if (pref && pref.ActiveDietName) {
            setDietMode(pref.ActiveDietName);
          }
        }
      } catch (e) { 
        console.error("Init Error:", e); 
      }
    };

    initializeAppData();
    return () => clearInterval(timer);
  }, []);

  const handleDietChange = async (newDiet) => {
    setDietMode(newDiet);
    try {
      // DATA_01: Save preference for UserID 2
      await fetch('http://localhost:5000/api/user/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 2, dietName: newDiet })
      });
    } catch (e) {
      console.error("Failed to save preference:", e);
    }
  };

  const updateVitals = useCallback((meal) => {
    setDailyStats(prev => ({
      ...prev,
      calories: prev.calories + (meal.calories || 0),
      protein: prev.protein + (meal.proteinGrams || 0)
    }));
  }, []);

  return (
    <div className="amble-app">
      <header className="top-command-bar">
        <div className="clock-wrapper">
          <div className="clock-display">
            {time.toLocaleTimeString()}
          </div>
        </div>
        
        <div className="spacer-ten-spaces"></div>

        <div className="diet-control">
          <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Current Plan:</label>
          <select 
            className="diet-selector" 
            value={dietMode} 
            onChange={(e) => handleDietChange(e.target.value)}
          >
            {dietList.map(diet => (
              <option key={diet} value={diet}>{diet}</option>
            ))}
          </select>
        </div>

        <VitalsBar dailyStats={dailyStats} />
        
        <div className="global-logo-container">
          <img src="logo_amble.png" alt="Amble Logo" className="app-logo" />
        </div>
      </header>
      
      <main className="main-content">
        <section className="planner-section card">
          <Dashboard 
            currentDiet={dietMode}
            onMealAdded={updateVitals} 
            onIngredientsAdded={(items) => setIngredients(prev => [...prev, ...items])}
          />
        </section>
        
        <aside className="sidebar-section">
          <GroceryList items={ingredients} />
        </aside>
      </main>
    </div>
  );
}

export default App;