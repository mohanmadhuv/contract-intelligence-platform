import React from 'react';
import ResponseCard from './ResponseCard';
import './MessageBubble.css';

function MessageBubble({ message }) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`message-wrapper ${message.role}`}>
      {isAssistant ? (
        <ResponseCard response={message} />
      ) : (
        <div className="message-bubble">{message.content}</div>
      )}
    </div>
  );
}

export default MessageBubble;
