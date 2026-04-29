import React, { useState } from 'react';
import './DataSummary.css';

function DataSummary({ data }) {
  const [activeView, setActiveView] = useState('cost-growth');

  const sections = [
    {
      header: 'ANALYSE',
      items: [
        {
          id: 'cost-growth',
          label: 'Cost Growth',
          sublabel: 'Which categories are getting more expensive?',
          icon: '📊',
        },
        {
          id: 'spend-decomposition',
          label: 'Spend Decomposition',
          sublabel: 'Volume, price, or vendor capture?',
          icon: '🔬',
        },
        {
          id: 'vendor-capture',
          label: 'Vendor Capture',
          sublabel: 'Who controls each market?',
          icon: '🏆',
        },
        {
          id: 'rate-benchmarking',
          label: 'Rate Benchmarking',
          sublabel: 'Are we overpaying?',
          icon: '⚖️',
        },
      ],
    },
    {
      header: 'SIGNALS',
      items: [
        {
          id: 'anomaly-flags',
          label: 'Anomaly Flags',
          sublabel: 'Contracts that need attention',
          icon: '🚨',
        },
        {
          id: 'sole-source-creep',
          label: 'Sole-Source Creep',
          sublabel: 'Competitive-to-captive drift',
          icon: '📉',
        },
        {
          id: 'label-shifting',
          label: 'Label Shifting',
          sublabel: 'Spend hiding in plain sight',
          icon: '🔀',
        },
      ],
    },
    {
      header: 'INVESTIGATE',
      items: [
        {
          id: 'vendor-profiles',
          label: 'Vendor Profiles',
          sublabel: 'Full cross-department footprint',
          icon: '🔍',
        },
        {
          id: 'promises-vs-reality',
          label: 'Promises vs. Reality',
          sublabel: 'Budget cuts vs. actual spend',
          icon: '📋',
        },
      ],
    },
  ];

  return (
    <div className="data-summary">
      <img src="/signature.svg" alt="Logo" className="sidebar-logo" />
      {sections.map((section) => (
        <div key={section.header} className="sidebar-section">
          <div className="section-header">{section.header}</div>
          <nav className="nav-menu">
            {section.items.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => setActiveView(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">
                  {item.label}
                  <span className="nav-sublabel">{item.sublabel}</span>
                </span>
              </button>
            ))}
          </nav>
        </div>
      ))}
    </div>
  );
}

export default DataSummary;
