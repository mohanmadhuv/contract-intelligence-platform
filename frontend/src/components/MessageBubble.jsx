import React, { useState } from 'react';
import './MessageBubble.css';

function MessageBubble({ message }) {
  const [showDetails, setShowDetails] = useState(false);
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`message-bubble ${message.role}-message`}>
      <div className="message-content">{message.content}</div>

      {isAssistant && message.suggestedActions && message.suggestedActions.length > 0 && (
        <div className="message-actions">
          <button
            className="details-toggle"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? '− Details' : '+ Actions & Data'}
          </button>

          {showDetails && (
            <div className="details-panel">
              {message.suggestedActions.length > 0 && (
                <div className="actions-section">
                  <h4>Next Steps</h4>
                  <ul>
                    {message.suggestedActions.map((action, idx) => (
                      <li key={idx}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}

              {message.visualization && (
                <div className="viz-section">
                  <p>Would you like to see a {message.visualization.type}?</p>
                </div>
              )}

              {message.dataReferences && Object.keys(message.dataReferences).length > 0 && (
                <div className="data-section">
                  <h4>Data References</h4>
                  <pre>{JSON.stringify(message.dataReferences, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <span className="message-time">
        {message.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}

export default MessageBubble;
