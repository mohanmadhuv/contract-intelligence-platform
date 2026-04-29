import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import MessageBubble from './MessageBubble';
import './ChatInterface.css';

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
      <div className="chat-header">
        <h2>Chat with Claude</h2>
        <p className="chat-subtitle">Ask questions about government contract spending</p>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && !loading && (
          <div className="chat-empty-state">
            <div className="empty-state-icon">💬</div>
            <h3>Welcome to Contract Intelligence</h3>
            <p>Ask me about:</p>
            <ul>
              <li>Rising costs in specific categories</li>
              <li>Which vendors are dominating markets</li>
              <li>Whether contract rates are competitive</li>
              <li>Why government spending is increasing</li>
            </ul>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {loading && (
          <div className="message-bubble assistant-message">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="message-bubble error-message">
            <div className="message-content">{error}</div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <div className="input-wrapper">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about contract spending, vendors, costs..."
            disabled={loading}
            className="chat-input"
          />
          <button type="submit" disabled={loading || !inputValue.trim()} className="send-button">
            {loading ? '...' : '↑'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatInterface;
