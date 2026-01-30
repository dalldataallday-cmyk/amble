/**
 * File: MealDetailModal.jsx
 * Version: 1.0.0
 * Description: Interactive modal displaying meal details and ingredient health benefits.
 *              Supports both actual images and placeholder/AI-generated images.
 * 
 * Props:
 *   - meal: Object containing meal data (name, calories, protein, ingredients, etc.)
 *   - isOpen: Boolean to control modal visibility
 *   - onClose: Function to close the modal
 */

import React, { useState, useEffect } from 'react';
import './MealDetailModal.css';

// Static health benefits database (can be moved to backend API for scalability)
const INGREDIENT_BENEFITS = {
    // Proteins
    'chicken': {
        nutrients: [
            { name: 'Protein', benefit: 'Builds and repairs muscle tissue' },
            { name: 'Vitamin B6', benefit: 'Supports brain health and energy metabolism' },
            { name: 'Niacin', benefit: 'Supports digestive and nervous system health' },
            { name: 'Selenium', benefit: 'Powerful antioxidant supporting thyroid function' }
        ],
        keyBenefits: ['Lean Muscle Building', 'Weight Management', 'Immune Support']
    },
    'salmon': {
        nutrients: [
            { name: 'Omega-3 Fatty Acids', benefit: 'Reduces inflammation and supports heart health' },
            { name: 'Protein', benefit: 'Complete protein with all essential amino acids' },
            { name: 'Vitamin D', benefit: 'Supports bone health and immune function' },
            { name: 'Vitamin B12', benefit: 'Essential for nerve function and red blood cells' }
        ],
        keyBenefits: ['Heart Health', 'Brain Function', 'Anti-Inflammatory']
    },
    'beef': {
        nutrients: [
            { name: 'Iron', benefit: 'Essential for oxygen transport in blood' },
            { name: 'Zinc', benefit: 'Supports immune function and wound healing' },
            { name: 'Vitamin B12', benefit: 'Critical for nerve and blood cell health' },
            { name: 'Creatine', benefit: 'Supports muscle energy and performance' }
        ],
        keyBenefits: ['Energy Production', 'Muscle Strength', 'Cognitive Function']
    },
    'eggs': {
        nutrients: [
            { name: 'Choline', benefit: 'Essential for brain health and liver function' },
            { name: 'Protein', benefit: 'Complete protein with all 9 essential amino acids' },
            { name: 'Vitamin D', benefit: 'Supports calcium absorption and bone health' },
            { name: 'Lutein', benefit: 'Protects eye health and vision' }
        ],
        keyBenefits: ['Brain Health', 'Eye Protection', 'Muscle Maintenance']
    },
    'shrimp': {
        nutrients: [
            { name: 'Protein', benefit: 'Low-calorie, high-quality protein source' },
            { name: 'Selenium', benefit: 'Supports thyroid and immune function' },
            { name: 'Vitamin B12', benefit: 'Supports energy and nerve health' },
            { name: 'Astaxanthin', benefit: 'Powerful antioxidant for skin and heart' }
        ],
        keyBenefits: ['Low-Calorie Protein', 'Thyroid Support', 'Antioxidant Rich']
    },

    // Vegetables
    'spinach': {
        nutrients: [
            { name: 'Iron', benefit: 'Supports oxygen transport and energy levels' },
            { name: 'Vitamin K', benefit: 'Essential for blood clotting and bone health' },
            { name: 'Vitamin A', benefit: 'Supports vision and immune function' },
            { name: 'Folate', benefit: 'Critical for cell division and DNA synthesis' }
        ],
        keyBenefits: ['Energy Boost', 'Bone Strength', 'Eye Health']
    },
    'broccoli': {
        nutrients: [
            { name: 'Vitamin C', benefit: 'Boosts immune system and collagen production' },
            { name: 'Vitamin K', benefit: 'Supports bone health and blood clotting' },
            { name: 'Fiber', benefit: 'Promotes digestive health and satiety' },
            { name: 'Sulforaphane', benefit: 'Powerful compound with anti-cancer properties' }
        ],
        keyBenefits: ['Immune Boost', 'Digestive Health', 'Cancer Prevention']
    },
    'cauliflower': {
        nutrients: [
            { name: 'Vitamin C', benefit: 'Supports immune function and skin health' },
            { name: 'Vitamin K', benefit: 'Important for bone metabolism' },
            { name: 'Fiber', benefit: 'Aids digestion and promotes fullness' },
            { name: 'Choline', benefit: 'Supports brain health and metabolism' }
        ],
        keyBenefits: ['Low-Carb Alternative', 'Brain Health', 'Detoxification']
    },
    'zucchini': {
        nutrients: [
            { name: 'Vitamin C', benefit: 'Supports immune function and skin health' },
            { name: 'Vitamin A', benefit: 'Important for vision and immune health' },
            { name: 'Potassium', benefit: 'Helps regulate blood pressure' },
            { name: 'Fiber', benefit: 'Aids digestion and promotes gut health' }
        ],
        keyBenefits: ['Healthy Vision', 'Heart Health', 'Hydration & Weight Management']
    },
    'avocado': {
        nutrients: [
            { name: 'Healthy Fats', benefit: 'Monounsaturated fats support heart health' },
            { name: 'Potassium', benefit: 'More than bananas, supports blood pressure' },
            { name: 'Fiber', benefit: 'Promotes satiety and digestive health' },
            { name: 'Vitamin E', benefit: 'Powerful antioxidant for skin health' }
        ],
        keyBenefits: ['Heart Health', 'Nutrient Absorption', 'Skin Health']
    },
    'kale': {
        nutrients: [
            { name: 'Vitamin K', benefit: 'One of the best sources for bone health' },
            { name: 'Vitamin A', benefit: 'Supports vision and immune function' },
            { name: 'Vitamin C', benefit: 'Powerful antioxidant and immune booster' },
            { name: 'Calcium', benefit: 'Supports bone density and muscle function' }
        ],
        keyBenefits: ['Bone Health', 'Detoxification', 'Anti-Inflammatory']
    },
    'sweet potato': {
        nutrients: [
            { name: 'Beta-Carotene', benefit: 'Converts to Vitamin A for vision health' },
            { name: 'Fiber', benefit: 'Supports digestive health and blood sugar' },
            { name: 'Potassium', benefit: 'Supports heart and muscle function' },
            { name: 'Vitamin C', benefit: 'Boosts immunity and collagen production' }
        ],
        keyBenefits: ['Eye Health', 'Blood Sugar Control', 'Gut Health']
    },

    // Fats & Oils
    'olive oil': {
        nutrients: [
            { name: 'Monounsaturated Fats', benefit: 'Supports heart health and reduces inflammation' },
            { name: 'Polyphenols', benefit: 'Powerful antioxidants protecting cells' },
            { name: 'Vitamin E', benefit: 'Protects cells from oxidative damage' },
            { name: 'Oleocanthal', benefit: 'Natural anti-inflammatory compound' }
        ],
        keyBenefits: ['Heart Health', 'Brain Protection', 'Anti-Aging']
    },
    'butter': {
        nutrients: [
            { name: 'Vitamin A', benefit: 'Supports vision and immune function' },
            { name: 'Vitamin K2', benefit: 'Directs calcium to bones, not arteries' },
            { name: 'Butyrate', benefit: 'Short-chain fatty acid supporting gut health' },
            { name: 'CLA', benefit: 'May support metabolism and body composition' }
        ],
        keyBenefits: ['Fat-Soluble Vitamins', 'Gut Health', 'Satiety']
    },
    'coconut oil': {
        nutrients: [
            { name: 'MCTs', benefit: 'Medium-chain triglycerides for quick energy' },
            { name: 'Lauric Acid', benefit: 'Antimicrobial and immune-supporting' },
            { name: 'Saturated Fats', benefit: 'Stable for high-heat cooking' }
        ],
        keyBenefits: ['Quick Energy', 'Immune Support', 'Cooking Stability']
    },

    // Dairy
    'cheese': {
        nutrients: [
            { name: 'Calcium', benefit: 'Essential for bone and teeth health' },
            { name: 'Protein', benefit: 'Complete protein for muscle maintenance' },
            { name: 'Vitamin B12', benefit: 'Supports nerve function and energy' },
            { name: 'Phosphorus', benefit: 'Works with calcium for bone health' }
        ],
        keyBenefits: ['Bone Health', 'Muscle Maintenance', 'Satiety']
    },
    'greek yogurt': {
        nutrients: [
            { name: 'Probiotics', benefit: 'Live cultures supporting gut health' },
            { name: 'Protein', benefit: 'High protein content for satiety' },
            { name: 'Calcium', benefit: 'Supports bone density' },
            { name: 'Vitamin B12', benefit: 'Energy metabolism support' }
        ],
        keyBenefits: ['Gut Health', 'Protein Rich', 'Bone Strength']
    },

    // Nuts & Seeds
    'walnuts': {
        nutrients: [
            { name: 'Omega-3 ALA', benefit: 'Plant-based omega-3 for brain health' },
            { name: 'Antioxidants', benefit: 'Highest antioxidant content among nuts' },
            { name: 'Fiber', benefit: 'Supports digestive health' },
            { name: 'Melatonin', benefit: 'Natural compound supporting sleep' }
        ],
        keyBenefits: ['Brain Health', 'Heart Protection', 'Sleep Support']
    },
    'almonds': {
        nutrients: [
            { name: 'Vitamin E', benefit: 'Powerful antioxidant for skin health' },
            { name: 'Magnesium', benefit: 'Supports muscle and nerve function' },
            { name: 'Fiber', benefit: 'Promotes satiety and digestive health' },
            { name: 'Protein', benefit: 'Plant-based protein source' }
        ],
        keyBenefits: ['Skin Health', 'Blood Sugar Control', 'Heart Health']
    },

    // Grains & Legumes
    'quinoa': {
        nutrients: [
            { name: 'Complete Protein', benefit: 'All 9 essential amino acids' },
            { name: 'Fiber', benefit: 'Supports digestive health and satiety' },
            { name: 'Iron', benefit: 'Supports oxygen transport' },
            { name: 'Magnesium', benefit: 'Supports muscle and nerve function' }
        ],
        keyBenefits: ['Complete Protein', 'Gluten-Free', 'Blood Sugar Friendly']
    },
    'lentils': {
        nutrients: [
            { name: 'Plant Protein', benefit: 'Excellent vegetarian protein source' },
            { name: 'Fiber', benefit: 'High fiber for digestive health' },
            { name: 'Iron', benefit: 'Important for vegetarians' },
            { name: 'Folate', benefit: 'Supports cell growth and DNA synthesis' }
        ],
        keyBenefits: ['Heart Health', 'Blood Sugar Control', 'Digestive Health']
    },
    'chickpeas': {
        nutrients: [
            { name: 'Plant Protein', benefit: 'Good vegetarian protein source' },
            { name: 'Fiber', benefit: 'Promotes fullness and gut health' },
            { name: 'Folate', benefit: 'Essential for cell division' },
            { name: 'Iron', benefit: 'Supports energy levels' }
        ],
        keyBenefits: ['Blood Sugar Control', 'Weight Management', 'Gut Health']
    },

    // Default fallback
    'default': {
        nutrients: [
            { name: 'Various Nutrients', benefit: 'Contributes to overall nutritional balance' }
        ],
        keyBenefits: ['Balanced Nutrition', 'Dietary Variety']
    }
};

// Helper function to find benefits for an ingredient
const findIngredientBenefits = (ingredientName) => {
    const normalizedName = ingredientName.toLowerCase();
    
    // Check for exact match first
    if (INGREDIENT_BENEFITS[normalizedName]) {
        return { name: ingredientName, ...INGREDIENT_BENEFITS[normalizedName] };
    }
    
    // Check for partial matches
    for (const key of Object.keys(INGREDIENT_BENEFITS)) {
        if (normalizedName.includes(key) || key.includes(normalizedName)) {
            return { name: ingredientName, ...INGREDIENT_BENEFITS[key] };
        }
    }
    
    // Return default if no match found
    return { name: ingredientName, ...INGREDIENT_BENEFITS['default'] };
};

const MealDetailModal = ({ meal, isOpen, onClose }) => {
    const [ingredientBenefits, setIngredientBenefits] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        if (meal && meal.ingredients) {
            // Process ingredients to get health benefits
            const benefits = meal.ingredients.map(ing => 
                findIngredientBenefits(ing.IngredientName)
            );
            setIngredientBenefits(benefits);
        }
    }, [meal]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setActiveTab('overview');
            setImageError(false);
        }
    }, [isOpen]);

    if (!isOpen || !meal) return null;

    // Generate placeholder image URL if actual image fails or doesn't exist
    const getImageUrl = () => {
        if (meal.img && !imageError) {
            return meal.img;
        }
        // Fallback to a food placeholder service
        const encodedName = encodeURIComponent(meal.name || 'Healthy Meal');
        return `https://placehold.co/400x300/2d5a3d/ffffff?text=${encodedName}`;
    };

    // Calculate total macros
    const totalMacros = {
        calories: meal.calories || 0,
        protein: meal.protein || 0,
        fat: meal.fat || 0,
        carbs: meal.carbs || 0
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="modal-title-section">
                        <h2 className="modal-title">{meal.name}</h2>
                        <span className="modal-subtitle">Nutritional Education</span>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>

                {/* Tab Navigation */}
                <div className="modal-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'benefits' ? 'active' : ''}`}
                        onClick={() => setActiveTab('benefits')}
                    >
                        Health Benefits
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'ingredients' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ingredients')}
                    >
                        Ingredients
                    </button>
                </div>

                {/* Tab Content */}
                <div className="modal-body">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="tab-content overview-tab">
                            <div className="meal-image-container">
                                <img 
                                    src={getImageUrl()} 
                                    alt={meal.name}
                                    className="meal-image"
                                    onError={() => setImageError(true)}
                                />
                                <div className="image-badge">
                                    {imageError ? '🖼️ Placeholder' : '📷 Meal Photo'}
                                </div>
                            </div>
                            
                            <div className="macro-summary">
                                <h3>Nutritional Summary</h3>
                                <div className="macro-grid">
                                    <div className="macro-card calories">
                                        <span className="macro-value">{totalMacros.calories}</span>
                                        <span className="macro-label">Calories</span>
                                    </div>
                                    <div className="macro-card protein">
                                        <span className="macro-value">{totalMacros.protein}g</span>
                                        <span className="macro-label">Protein</span>
                                    </div>
                                    <div className="macro-card fat">
                                        <span className="macro-value">{totalMacros.fat}g</span>
                                        <span className="macro-label">Fat</span>
                                    </div>
                                    <div className="macro-card carbs">
                                        <span className="macro-value">{totalMacros.carbs}g</span>
                                        <span className="macro-label">Carbs</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Benefits Preview */}
                            <div className="quick-benefits">
                                <h3>Key Health Benefits</h3>
                                <div className="benefits-preview">
                                    {ingredientBenefits.slice(0, 3).map((ing, idx) => (
                                        <div key={idx} className="benefit-chip">
                                            ✓ {ing.keyBenefits?.[0] || 'Nutritious'}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Health Benefits Tab */}
                    {activeTab === 'benefits' && (
                        <div className="tab-content benefits-tab">
                            <div className="benefits-intro">
                                <p>Discover the powerful health benefits of each ingredient in your meal:</p>
                            </div>
                            
                            {ingredientBenefits.map((ingredient, idx) => (
                                <div key={idx} className="ingredient-benefit-card">
                                    <div className="ingredient-header">
                                        <h4 className="ingredient-name">
                                            <span className="ingredient-icon">🥗</span>
                                            {ingredient.name}
                                        </h4>
                                    </div>
                                    
                                    <div className="nutrient-list">
                                        {ingredient.nutrients?.map((nutrient, nIdx) => (
                                            <div key={nIdx} className="nutrient-item">
                                                <span className="nutrient-name">{nutrient.name}:</span>
                                                <span className="nutrient-benefit">{nutrient.benefit}</span>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="key-benefits">
                                        <span className="benefits-label">Key Benefits:</span>
                                        <div className="benefits-tags">
                                            {ingredient.keyBenefits?.map((benefit, bIdx) => (
                                                <span key={bIdx} className="benefit-tag">
                                                    ✓ {benefit}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Ingredients Tab */}
                    {activeTab === 'ingredients' && (
                        <div className="tab-content ingredients-tab">
                            <h3>Shopping List</h3>
                            <p className="ingredients-intro">
                                Here's what you'll need to prepare this meal:
                            </p>
                            
                            {meal.ingredients && meal.ingredients.length > 0 ? (
                                <div className="ingredients-grid">
                                    {Object.entries(
                                        meal.ingredients.reduce((groups, ing) => {
                                            const group = ing.SmartGroup || 'Other';
                                            if (!groups[group]) groups[group] = [];
                                            groups[group].push(ing);
                                            return groups;
                                        }, {})
                                    ).map(([group, items]) => (
                                        <div key={group} className="ingredient-group">
                                            <h4 className="group-header">
                                                {getGroupIcon(group)} {group}
                                            </h4>
                                            <ul className="ingredient-list">
                                                {items.map((ing, idx) => (
                                                    <li key={idx} className="ingredient-list-item">
                                                        <span className="ing-qty">{ing.Quantity}</span>
                                                        <span className="ing-name">{ing.IngredientName}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-ingredients">
                                    Ingredient details are being loaded...
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>
                        Close
                    </button>
                    <button className="btn-primary" onClick={onClose}>
                        Got It!
                    </button>
                </div>
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
        'Other': '📦'
    };
    return icons[group] || '📦';
};

export default MealDetailModal;
