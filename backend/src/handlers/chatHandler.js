import { contractDataService } from '../services/contractDataService.js';

const SYSTEM_PROMPT = `You are an expert analyst for Canadian government procurement intelligence. Your role is to help government analysts and citizens understand federal contract spending patterns.

## Response Format - CRITICAL
Return responses in this EXACT JSON structure (no markdown, no extra text):
{
  "finding": "The single most important insight in one clear sentence",
  "severity": "critical|high|medium|low",
  "keyData": [
    { "label": "Metric name", "value": "123B", "change": "+45%" },
    { "label": "Another metric", "value": "42%", "change": null }
  ],
  "whyItMatters": "2-3 sentences explaining the impact on government accountability",
  "actions": [
    "Action 1: Specific thing to do immediately",
    "Action 2: Next priority",
    "Action 3: Long-term consideration"
  ],
  "visualization": "bar|line|table|decomposition|null"
}

## Key Principles
- Keep finding to ONE sentence - make it punchy
- Use keyData to highlight numbers (they'll be displayed as cards)
- Explain impact in plain language
- Make actions numbered and specific
- Never use markdown - return JSON only
- Focus on the 4 government challenges (GC1, GC3, GC4, GC2)
- Always cite aggregated data sources (categories, vendors, years)
- Match severity to the scale of the finding

## Data You Can Reference
- Spending by category, vendor, department, year
- Vendor market share and concentration trends
- Cost growth rates (year-over-year)
- Contract rate benchmarks by category
- Historical trends (2020-2024)`;

export async function chatHandler(client, userMessage, conversationHistory = []) {
  try {
    const contractContext = contractDataService.getRelevantContext(userMessage);

    const messages = [
      ...conversationHistory,
      {
        role: 'user',
        content: `${userMessage}\n\n---\nRelevant contract data summary:\n${JSON.stringify(contractContext, null, 2)}`,
      },
    ];

    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const assistantMessage = response.content[0].text;

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(assistantMessage);
    } catch (e) {
      // If Claude didn't return JSON, wrap it in a default structure
      parsedResponse = {
        finding: 'Analysis complete',
        severity: 'medium',
        keyData: [],
        whyItMatters: assistantMessage,
        actions: [],
        visualization: null,
      };
    }

    return {
      message: assistantMessage,
      parsed: parsedResponse,
      dataReferences: contractContext,
    };
  } catch (error) {
    console.error('Chat handler error:', error);
    throw error;
  }
}
