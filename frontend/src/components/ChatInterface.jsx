import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import MessageBubble from './MessageBubble';
import './ChatInterface.css';

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTools, setShowTools] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) {
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue('');
    setError(null);

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      },
    ]);

    setLoading(true);

    try {
      const conversationHistory = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const response = await axios.post('http://localhost:3001/chat', {
        message: userMessage,
        conversationHistory,
      });

      const { message, insights, suggestedActions, dataReferences, visualization } = response.data;

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: message,
          insights,
          suggestedActions,
          dataReferences,
          visualization,
          timestamp: new Date(),
        },
      ]);
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
              <button className="example-btn">Show me rising costs</button>
              <button className="example-btn">Who dominates consulting?</button>
              <button className="example-btn">Are rates competitive?</button>
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
              <button
                className="tool-collapse"
                onClick={() => setShowTools(false)}
              >
                ⌃
              </button>
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
