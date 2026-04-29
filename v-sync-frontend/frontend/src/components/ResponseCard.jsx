import React, { useState } from 'react';
import './ResponseCard.css';

function ResponseCard({ response }) {
  const [showActions, setShowActions] = useState(true);

  if (!response?.parsed) {
    return <div className="response-card fallback">{response}</div>;
  }

  const { finding, severity, keyData, whyItMatters, actions, visualization } = response.parsed;

  const severityColor = {
    critical: '#dc2626',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
  };

  return (
    <div className="response-card">
      <div className="finding-section">
        <div className="severity-indicator" style={{ backgroundColor: severityColor[severity] }} />
        <div className="finding-text">{finding}</div>
      </div>

      {keyData && keyData.length > 0 && (
        <div className="key-data">
          {keyData.map((item, idx) => (
            <div key={idx} className="data-point">
              <div className="data-label">{item.label}</div>
              <div className="data-value">{item.value}</div>
              {item.change && <div className="data-change">{item.change}</div>}
            </div>
          ))}
        </div>
      )}

      {whyItMatters && (
        <div className="context-section">
          <div className="section-label">Why It Matters</div>
          <div className="context-text">{whyItMatters}</div>
        </div>
      )}

      {actions && actions.length > 0 && (
        <div className="actions-section">
          <button
            className="actions-toggle"
            onClick={() => setShowActions(!showActions)}
          >
            <span className="toggle-icon">{showActions ? '−' : '+'}</span>
            What To Do ({actions.length})
          </button>

          {showActions && (
            <div className="actions-list">
              {actions.map((action, idx) => (
                <div key={idx} className="action-item">
                  <div className="action-number">{idx + 1}</div>
                  <div className="action-text">{action}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {visualization && (
        <div className="viz-section">
          <button className="viz-btn">
            📊 View as {visualization}
          </button>
        </div>
      )}
    </div>
  );
}

export default ResponseCard;
