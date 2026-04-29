import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import MessageBubble from './MessageBubble';
import './ChatInterface.css';

function titleFromMessage(msg) {
  return msg.length > 46 ? msg.slice(0, 43) + '...' : msg;
}

function ChatInterface({ conversation, onUpdate }) {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTools, setShowTools] = useState(false);
  const messagesEndRef = useRef(null);

  const messages = conversation.messages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setError(null);

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    const isFirstMessage = messages.length === 0;
    const messagesWithUser = [...messages, userMsg];

    onUpdate({
      messages: messagesWithUser,
      ...(isFirstMessage && { title: titleFromMessage(userMessage) }),
    });

    const conversationHistory = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setLoading(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await axios.post(`${apiUrl}/chat`, {
        message: userMessage,
        conversationHistory,
      });

      const { message, dataReferences } = response.data;

      onUpdate({
        messages: [
          ...messagesWithUser,
          {
            id: Date.now() + 1,
            role: 'assistant',
            content: message,
            dataReferences,
            timestamp: new Date(),
          },
        ],
      });
    } catch (err) {
      setError('Failed to get response. Please try again.');
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-messages">
        {messages.length === 0 && !loading && (
          <div className="chat-empty-state">
            <div className="empty-state-logo">📊</div>
            <h2>Contract Intelligence</h2>
            <p>Ask me about government contract spending</p>
            <div className="example-queries">
              <button className="example-btn" onClick={() => setInputValue('Show me rising costs')}>
                Show me rising costs
              </button>
              <button className="example-btn" onClick={() => setInputValue('Who dominates consulting?')}>
                Who dominates consulting?
              </button>
              <button className="example-btn" onClick={() => setInputValue('Are rates competitive?')}>
                Are rates competitive?
              </button>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {loading && (
          <div className="message-wrapper assistant">
            <div className="message-bubble">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="message-wrapper error">
            <div className="message-bubble">{error}</div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-footer">
        {showTools && (
          <div className="chat-tools">
            <div className="tools-section">
              <div className="tool-group">
                <button className="tool-btn" title="Filter data">🔍</button>
                <button className="tool-btn" title="Upload file">📎</button>
                <button className="tool-btn" title="Change mode">⚙️</button>
              </div>
              <button className="tool-collapse" onClick={() => setShowTools(false)}>⌃</button>
            </div>
          </div>
        )}

        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <div className="input-container">
            <button
              type="button"
              className="tools-toggle"
              onClick={() => setShowTools(!showTools)}
              title="Tools & filters"
            >
              +
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about spending, vendors, costs..."
              disabled={loading}
              className="chat-input"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="send-btn"
            >
              ↑
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatInterface;
