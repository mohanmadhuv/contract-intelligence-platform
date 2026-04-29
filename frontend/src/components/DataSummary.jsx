import React from 'react';
import './DataSummary.css';

function DataSummary({ data }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  return (
    <div className="data-summary">
      <h3>Dataset Overview</h3>

      <div className="summary-card">
        <div className="card-value">{formatCurrency(data.totalSpend2024)}</div>
        <div className="card-label">2024 Spending</div>
      </div>

      <div className="summary-card">
        <div className="card-value">{data.categories}</div>
        <div className="card-label">Categories</div>
      </div>

      <div className="summary-card">
        <div className="card-value">{data.vendors}</div>
        <div className="card-label">Major Vendors</div>
      </div>

      {data.highConcentrationCategories && data.highConcentrationCategories.length > 0 && (
        <div className="alerts-section">
          <h4>⚠️ High Concentration</h4>
          <ul className="alerts-list">
            {data.highConcentrationCategories.slice(0, 3).map((alert, idx) => (
              <li key={idx}>
                <strong>{alert.category}</strong>
                <br />
                {alert.topVendor}: {(alert.marketShare * 100).toFixed(0)}%
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.topAnomalies && data.topAnomalies.length > 0 && (
        <div className="alerts-section">
          <h4>🚩 Rate Anomalies</h4>
          <ul className="alerts-list">
            {data.topAnomalies.slice(0, 3).map((anomaly, idx) => (
              <li key={idx}>
                <strong>{anomaly.vendor}</strong>
                <br />
                {(anomaly.variance).toFixed(0)}% above market
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="quick-queries">
        <h4>Try Asking</h4>
        <div className="query-list">
          <button className="query-btn">Show rising costs</button>
          <button className="query-btn">Who dominates consulting?</button>
          <button className="query-btn">Are rates competitive?</button>
        </div>
      </div>
    </div>
  );
}

export default DataSummary;
