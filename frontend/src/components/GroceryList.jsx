/**
 * File: GroceryList.jsx
 * Version: 1.1.0
 * 
 * CHANGES FROM 1.0.0:
 * - ADDED: Logo positioned next to "Smart Shopping List" header
 * - ADDED: Flexbox header layout for logo alignment
 * - ADDED: CSS import for new styles
 */

import React from 'react';
import './GroceryList.css';

const GroceryList = ({ items = [] }) => {
    // Group items by SmartGroup for organized display
    const grouped = (items || []).reduce((acc, item) => {
        const group = item.SmartGroup || 'Other';
        if (!acc[group]) acc[group] = [];
        acc[group].push(item);
        return acc;
    }, {});

    return (
        <div className="grocery-list-container">
            {/* Header with Logo */}
            <div className="grocery-header">
                <h3 className="grocery-title">Smart Shopping List</h3>
                <div className="grocery-logo-container">
                    <img 
                        src="logo_amble.png" 
                        alt="Amble Logo" 
                        className="grocery-logo"
                    />
                </div>
            </div>

            {/* Grocery Items */}
            <div className="grocery-content">
                {Object.keys(grouped).length === 0 ? (
                    <p className="empty-message">No items yet. Accept a meal to populate.</p>
                ) : (
                    Object.keys(grouped).map(group => (
                        <div key={group} className="grocery-group">
                            <h4 className="group-title">
                                <span className="group-icon">{getGroupIcon(group)}</span>
                                {group}
                            </h4>
                            <ul className="grocery-items">
                                {grouped[group].map((ing, idx) => (
                                    <li key={idx} className="grocery-item">
                                        <span className="item-qty">{ing.Quantity}</span>
                                        <span className="item-name">{ing.IngredientName}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// Helper function for group icons
const getGroupIcon = (group) => {
    const icons = {
        'Meat': '🥩',
        'Seafood': '🐟',
        'Produce': '🥬',
        'Dairy': '🧀',
        'Grains': '🌾',
        'Canned Goods': '🥫',
        'Oils': '🫒',
        'Spices': '🧂',
        'Nuts': '🥜',
        'Condiments': '🍯',
        'Bakery': '🍞',
        'Frozen': '❄️',
        'Baking': '🧁',
        'Deli': '🥪',
        'Snacks': '🍿',
        'Other': '📦'
    };
    return icons[group] || '📦';
};

export default GroceryList;
