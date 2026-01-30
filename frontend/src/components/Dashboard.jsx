/**
 * File: Dashboard.jsx
 * Version: 1.3.0
 * 
 * CHANGES FROM 1.2.0:
 * - UPDATED: IWS branding now uses green text instead of boxes
 * - UPDATED: "Integrated Wellness Solution (IWS)" is now a single styled title
 */

import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import MealDetailModal from './MealDetailModal';

const Dashboard = ({ currentDiet, onMealAdded, onIngredientsAdded }) => {
    const [weekData, setWeekData] = useState([]);
    const [suggestion, setSuggestion] = useState(null);
    const [selectedMeal, setSelectedMeal] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    useEffect(() => {
        const initialPlan = daysOfWeek.map(day => ({
            dayName: day,
            meals: [], 
            vitals: { calories: 0, protein: 0 }
        }));
        setWeekData(initialPlan);
    }, []);

    const getAiSuggestion = async (dayIndex) => {
        try {
            const response = await fetch(`http://localhost:5000/api/meals/suggest?diet=${encodeURIComponent(currentDiet)}`);
            
            if (!response.ok) {
                throw new Error('No meals found for this category');
            }

            const data = await response.json();
            
            setSuggestion({
                mealId: data.MealID,
                name: data.MealName,
                calories: data.Calories || 0,
                protein: data.ProteinGrams || 0,
                fat: data.FatGrams || 0,
                carbs: data.CarbGrams || 0,
                img: data.ImageURL || 'https://placehold.co/100x100?text=No+Image',
                ingredients: data.ingredients || [], 
                dayIndex: dayIndex
            });
        } catch (err) {
            console.error("AI Suggestion Error:", err);
            alert(`Could not find a ${currentDiet} meal in the database.`);
        }
    };

    /**
     * DATA_05: Persist accepted meal to SQL Server
     */
    const acceptSuggestion = async () => {
        if (!suggestion) return;

        try {
            // 1. Persist to Backend (Targeting Dwayne/UserID 2)
            const response = await fetch('http://localhost:5000/api/meal-plans/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 2,
                    mealId: suggestion.mealId,
                    plannedDate: new Date().toISOString().split('T')[0],
                    mealTime: 'Lunch' 
                })
            });

            if (!response.ok) throw new Error('Failed to save meal plan to database');

            // 2. Update Local UI State - Store full meal data for modal
            const newWeekData = [...weekData];
            const mealToAdd = {
                mealId: suggestion.mealId,
                name: suggestion.name,
                calories: suggestion.calories,
                protein: suggestion.protein,
                fat: suggestion.fat,
                carbs: suggestion.carbs,
                img: suggestion.img,
                ingredients: suggestion.ingredients
            };

            newWeekData[suggestion.dayIndex].meals.push(mealToAdd);
            setWeekData(newWeekData);

            // 3. Notify App.js for global vitals and shopping list
            onMealAdded(mealToAdd);
            if (suggestion.ingredients.length > 0) {
                onIngredientsAdded(suggestion.ingredients);
            }

            setSuggestion(null);
            console.log("Meal successfully persisted to SQL Server.");
        } catch (err) {
            console.error("Save Error:", err);
            alert("The meal was added locally, but could not be saved to the database.");
        }
    };

    /**
     * Handle meal card click to open modal
     */
    const handleMealCardClick = (meal) => {
        console.log('[Dashboard] Opening meal detail modal for:', meal.name);
        setSelectedMeal(meal);
        setIsModalOpen(true);
    };

    /**
     * Close the modal
     */
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedMeal(null);
    };

    return (
        <div className="dashboard-container">
            {/* Header Section with IWS Branding - UPDATED: Single green title, no boxes */}
            <div className="planner-header">
                <h2>Weekly Meal Command</h2>
                <div className="iws-branding">
                    <span className="iws-title">Integrated Wellness Solution (IWS)</span>
                </div>
                <p>Generating suggestions for: <strong>{currentDiet}</strong></p>
            </div>

            {/* Educational Tip Banner */}
            <div className="education-banner">
                <span className="edu-icon">💡</span>
                <span className="edu-text">
                    <strong>Pro Tip:</strong> Click on any meal card to learn about the health benefits of its ingredients!
                </span>
            </div>

            {/* AI Suggestion Overlay */}
            {suggestion && (
                <div className="suggestion-overlay">
                    <div className="suggestion-content">
                        <img src={suggestion.img} alt={suggestion.name} className="suggestion-img" />
                        <div className="suggestion-text">
                            <h4>AI Suggestion for {daysOfWeek[suggestion.dayIndex]}</h4>
                            <p><strong>{suggestion.name}</strong></p>
                            <p>{suggestion.calories} Calories | {suggestion.protein}g Protein</p>
                        </div>
                    </div>
                    <div className="suggestion-actions">
                        <button className="btn-accept" onClick={acceptSuggestion}>Accept & Add to Plan</button>
                        <button className="btn-regenerate" onClick={() => getAiSuggestion(suggestion.dayIndex)}>Regenerate</button>
                        <button className="btn-info" onClick={() => handleMealCardClick(suggestion)}>
                            ℹ️ View Benefits
                        </button>
                        <button className="btn-cancel" onClick={() => setSuggestion(null)}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Weekly Calendar Grid */}
            <div className="calendar-grid">
                {weekData.map((day, index) => (
                    <div key={index} className="day-column">
                        <div className="day-header">{day.dayName}</div>
                        <div className="meal-slot">
                            {day.meals.map((meal, mIdx) => (
                                <div 
                                    key={mIdx} 
                                    className="meal-card-mini clickable"
                                    onClick={() => handleMealCardClick(meal)}
                                    title="Click to view health benefits"
                                >
                                    <span className="meal-name">{meal.name}</span>
                                    <span className="meal-cals">{meal.calories} kcal</span>
                                    <span className="meal-click-hint">Click for details →</span>
                                </div>
                            ))}
                            
                            <button 
                                className="add-meal-btn" 
                                onClick={() => getAiSuggestion(index)}
                            >
                                + Get AI Suggestion
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Meal Detail Modal */}
            <MealDetailModal 
                meal={selectedMeal}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        </div>
    );
};

export default Dashboard;
