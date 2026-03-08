import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { dataService } from './lib/providers/DataService.js';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 8888;
const geminiApiKey = process.env.GEMINI_API_KEY;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', key_present: !!geminiApiKey });
});

app.get('/api/sales-data', async (req, res) => {
  try {
    const data = await dataService.getSalesData();
    res.json(data);
  } catch (error) {
    console.error('Data Layer Error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch sales data' });
  }
});

app.post('/api/ai-insights', async (req, res) => {
  console.log(`[Server] Received AI insight request for model: ${req.body.modelName}`);
  const { modelName, prompt } = req.body;

  if (!geminiApiKey) {
    return res.status(500).json({ error: "Gemini API key is not configured on the server." });
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log(`[Server] Raw AI Response Length: ${text.length} chars`);
    
    // Improved JSON extraction: find the first { and last }
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI response did not contain valid JSON structure.");
    }
    
    const jsonString = jsonMatch[0];
    const data = JSON.parse(jsonString);
    console.log(`[Server] Successfully parsed AI insights.`);
    res.json(data);
  } catch (error) {
    console.error("AI Insight Error:", error.message);
    res.status(500).json({ error: error.message || "Failed to generate AI insights from the server." });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AI Proxy Server running at http://localhost:${PORT}`);
});
