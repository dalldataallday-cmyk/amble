/**
 * File: VitalsBar.jsx
 * Version: 1.1.0
 * Description: Real-time progress tracker for calories and protein. 
 * Integrated with global state and styled for the Amble forest theme.
 */

import React from 'react';

const VitalsBar = ({ dailyStats }) => {
  // Goal constants - could be moved to user profile settings later
  const GOALS = {
    calories: 2500,
    protein: 160
  };

  // Calculate percentages for progress bars
  const calPercent = Math.min((dailyStats.calories / GOALS.calories) * 100, 100);
  const proteinPercent = Math.min((dailyStats.protein / GOALS.protein) * 100, 100);

  const containerStyle = {
    display: 'flex',
    gap: '30px',
    alignItems: 'center',
    padding: '0 20px',
    flex: 1
  };

  const statGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '150px'
  };

  const labelStyle = {
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: '#3e563d',
    textTransform: 'uppercase',
    marginBottom: '4px',
    display: 'flex',
    justifyContent: 'space-between'
  };

  const progressTrackStyle = {
    width: '100%',
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden'
  };

  const barStyle = (color, percent) => ({
    width: `${percent}%`,
    height: '100%',
    backgroundColor: color,
    transition: 'width 0.5s ease-out'
  });

  return (
    <div className="vitals-bar-container" style={containerStyle}>
      {/* Calorie Tracker */}
      <div style={statGroupStyle}>
        <div style={labelStyle}>
          <span>Calories</span>
          <span>{dailyStats.calories} / {GOALS.calories}</span>
        </div>
        <div style={progressTrackStyle}>
          <div style={barStyle('#4caf50', calPercent)}></div>
        </div>
      </div>

      {/* Protein Tracker */}
      <div style={statGroupStyle}>
        <div style={labelStyle}>
          <span>Protein</span>
          <span>{dailyStats.protein}g / {GOALS.protein}g</span>
        </div>
        <div style={progressTrackStyle}>
          <div style={barStyle('#1e90ff', proteinPercent)}></div>
        </div>
      </div>

      {/* Water Intake (Simple Text for now) */}
      <div style={{ ...statGroupStyle, minWidth: '80px' }}>
        <div style={labelStyle}>Water</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
          {dailyStats.water}ml
        </div>
      </div>
    </div>
  );
};

export default VitalsBar;