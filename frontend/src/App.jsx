import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChatInterface from './components/ChatInterface';
import DataSummary from './components/DataSummary';
import './App.css';

function App() {
  const [dataSummary, setDataSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDataSummary = async () => {
      try {
        const response = await axios.get('http://localhost:3001/data/summary');
        setDataSummary(response.data);
      } catch (error) {
        console.error('Failed to fetch data summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDataSummary();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>Contract Intelligence</h1>
          <p className="subtitle">Canadian Government Procurement Analysis</p>
        </div>
      </header>

      <main className="app-main">
        <div className="app-container">
          <aside className="sidebar">
            {!loading && dataSummary && <DataSummary data={dataSummary} />}
          </aside>

          <section className="chat-section">
            <ChatInterface />
          </section>
        </div>
      </main>

      <footer className="app-footer">
        <p>
          Data from Open Canada | Building accountability in government procurement |{' '}
          <a href="https://open.canada.ca">Source</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
