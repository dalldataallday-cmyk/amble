import React from 'react';

const GroceryList = ({ items = [] }) => { // Default to empty array
    // The Crash happens here if items is undefined
    // We add the '?? []' or ensure items exists before reducing
    const grouped = (items || []).reduce((acc, item) => {
        const group = item.SmartGroup || 'Other';
        if (!acc[group]) acc[group] = [];
        acc[group].push(item);
        return acc;
    }, {});

    return (
        <div className="grocery-list-container">
            <h3>Smart Shopping List</h3>
            {Object.keys(grouped).length === 0 ? (
                <p>No items yet. Accept a meal to populate.</p>
            ) : (
                Object.keys(grouped).map(group => (
                    <div key={group} className="grocery-group">
                        <h4 className="group-title">{group}</h4>
                        <ul>
                            {grouped[group].map((ing, idx) => (
                                <li key={idx}>
                                    {ing.Quantity} {ing.IngredientName}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))
            )}
        </div>
    );
};

export default GroceryList;