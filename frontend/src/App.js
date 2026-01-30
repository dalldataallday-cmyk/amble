/**
 * File: App.js
 * Version: 1.2.0
 * 
 * CHANGES FROM 1.1.0:
 * - FIXED: Property name mismatch (protein vs proteinGrams) in updateVitals
 * - ADDED: Load daily totals from database on startup (persistence)
 * - ADDED: Refresh totals after meal is added
 * - IMPROVED: Error handling and loading states
 */

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
  const [isLoading, setIsLoading] = useState(true);

  // ============================================================================
  // NEW: Function to load daily totals from database
  // ============================================================================
  const loadDailyTotals = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/user/daily-totals/2');
      if (response.ok) {
        const data = await response.json();
        setDailyStats(prev => ({
          ...prev,
          calories: data.TotalCalories || 0,
          protein: data.TotalProtein || 0
          // water is tracked separately (could add hydration table later)
        }));
        console.log('[App.js] Loaded daily totals from DB:', data);
      }
    } catch (e) {
      console.error('[App.js] Failed to load daily totals:', e);
    }
  }, []);

  // ============================================================================
  // Load Preferences, Diet List, and Daily Totals on Startup
  // ============================================================================
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    const initializeAppData = async () => {
      setIsLoading(true);
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

        // NEW: Load today's totals from database (persistence!)
        await loadDailyTotals();

      } catch (e) { 
        console.error("[App.js] Init Error:", e); 
      } finally {
        setIsLoading(false);
      }
    };

    initializeAppData();
    return () => clearInterval(timer);
  }, [loadDailyTotals]);

  // ============================================================================
  // Handle Diet Change
  // ============================================================================
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
      console.error("[App.js] Failed to save preference:", e);
    }
  };

  // ============================================================================
  // FIXED: Update Vitals (corrected property name)
  // ============================================================================
  const updateVitals = useCallback((meal) => {
    console.log('[App.js] updateVitals called with:', meal);
    
    setDailyStats(prev => {
      const newStats = {
        ...prev,
        // FIX: Accept both 'protein' and 'proteinGrams' for flexibility
        calories: prev.calories + (meal.calories || 0),
        protein: prev.protein + (meal.protein || meal.proteinGrams || 0)
      };
      console.log('[App.js] New dailyStats:', newStats);
      return newStats;
    });

    // OPTIONAL: Reload from DB to ensure sync (belt-and-suspenders approach)
    // Uncomment if you want guaranteed accuracy from the database
    // setTimeout(() => loadDailyTotals(), 500);
  }, []);

  // ============================================================================
  // Handle Ingredients Added to Shopping List
  // ============================================================================
  const handleIngredientsAdded = useCallback((items) => {
    console.log('[App.js] Adding ingredients:', items);
    setIngredients(prev => [...prev, ...items]);
  }, []);

  // ============================================================================
  // Render
  // ============================================================================
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
          {isLoading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              Loading your meal plan...
            </div>
          ) : (
            <Dashboard 
              currentDiet={dietMode}
              onMealAdded={updateVitals} 
              onIngredientsAdded={handleIngredientsAdded}
            />
          )}
        </section>
        
        <aside className="sidebar-section">
          <GroceryList items={ingredients} />
        </aside>
      </main>
    </div>
  );
}

export default App;
