import express from 'express';
import cors from 'cors';
import { Anthropic } from '@anthropic-ai/sdk';
import { contractDataService } from './services/contractDataService.js';
import { chatHandler } from './handlers/chatHandler.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'contract-intelligence-api' });
});

app.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await chatHandler(client, message, conversationHistory);

    res.json({
      message: response.message,
      dataReferences: response.dataReferences,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

app.get('/data/summary', (req, res) => {
  try {
    const summary = contractDataService.getDataSummary();
    res.json(summary);
  } catch (error) {
    console.error('Data summary error:', error);
    res.status(500).json({ error: 'Failed to retrieve data summary' });
  }
});

app.get('/data/cost-trends', (req, res) => {
  try {
    const { category, years = 5 } = req.query;
    const trends = contractDataService.getCostTrends(category, parseInt(years));
    res.json(trends);
  } catch (error) {
    console.error('Cost trends error:', error);
    res.status(500).json({ error: 'Failed to retrieve cost trends' });
  }
});

app.get('/data/vendor-concentration', (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    const concentration = contractDataService.getVendorConcentration(category, parseInt(limit));
    res.json(concentration);
  } catch (error) {
    console.error('Vendor concentration error:', error);
    res.status(500).json({ error: 'Failed to retrieve vendor concentration' });
  }
});

app.get('/data/benchmarks', (req, res) => {
  try {
    const { category, type } = req.query;
    const benchmarks = contractDataService.getBenchmarks(category, type);
    res.json(benchmarks);
  } catch (error) {
    console.error('Benchmarks error:', error);
    res.status(500).json({ error: 'Failed to retrieve benchmarks' });
  }
});

app.listen(port, () => {
  console.log(`Contract Intelligence API running on port ${port}`);
  console.log('Endpoints: POST /chat, GET /health, GET /data/*');
});
