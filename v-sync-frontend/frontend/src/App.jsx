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
      <aside className="global-sidebar">
        {!loading && dataSummary && <DataSummary data={dataSummary} />}
      </aside>

      <main className="app-main">
        <ChatInterface />
      </main>
    </div>
  );
}

export default App;
