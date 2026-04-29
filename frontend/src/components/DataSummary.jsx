import React, { useState } from 'react';
import './DataSummary.css';

function DataSummary({ data }) {
  const [activeView, setActiveView] = useState('overview');

  const analysisItems = [
    { id: 'overview', label: 'Overview', icon: '◻️' },
    { id: 'category', label: 'Category deep-dive', icon: '≡' },
    { id: 'vendor', label: 'Vendor concentration', icon: '🌐' },
    { id: 'contracts', label: 'Contracts', icon: '📋' },
    { id: 'efficiency', label: 'Less for more', icon: '✨' },
  ];

  const exploreItems = [
    { id: 'timeseries', label: 'Time-series', icon: '📈' },
    { id: 'geography', label: 'Geography', icon: '🏛️' },
  ];

  return (
    <div className="data-summary">
      <div className="sidebar-section">
        <div className="section-header">ANALYSIS</div>
        <nav className="nav-menu">
          {analysisItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="sidebar-section">
        <div className="section-header">EXPLORE</div>
        <nav className="nav-menu">
          {exploreItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default DataSummary;
