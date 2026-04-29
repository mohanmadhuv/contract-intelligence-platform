import React from 'react';
import NarrativeBubble from './NarrativeBubble';
import './MessageBubble.css';

function MessageBubble({ message }) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`message-wrapper ${message.role}`}>
      {isAssistant ? (
        <NarrativeBubble content={message.content} />
      ) : (
        <div className="message-bubble">{message.content}</div>
      )}
    </div>
  );
}

export default MessageBubble;
