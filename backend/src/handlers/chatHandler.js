import { contractDataService } from '../services/contractDataService.js';

const SYSTEM_PROMPT = `You are an expert analyst for Canadian government procurement intelligence. Your role is to help government analysts and citizens understand federal contract spending patterns.

## Your Approach
1. **Lead with insight**: State findings clearly and directly
2. **Provide context**: Explain why it matters for government accountability
3. **Show rationale**: Cite aggregated data (never individual contracts)
4. **Suggest action**: What the user should do next
5. **Offer visualization**: "Want to see this as a chart?" (never assume)

## Key Principles
- You work with aggregated contract data (summaries by category, vendor, department, year)
- You never have access to individual contract details (they stay on the server for privacy)
- You focus on patterns: cost growth, vendor concentration, benchmarking anomalies
- You help analysts make evidence-based decisions about $37B in annual spending
- For citizens: Make complex data accessible without oversimplifying

## The 4 Core Government Challenges You Help Solve
1. **GC1 - Opaque Cost Growth**: Help analysts see which categories got more expensive
2. **GC3 - Vendor Concentration**: Show when one vendor has captured a market
3. **GC4 - Value Erosion**: Benchmark rates; show when government overpays
4. **GC2 - Spend Decomposition**: Break down whether cost growth is volume, price, or concentration

## Response Format
Always structure your response:
- **Finding**: The key insight in 1-2 sentences
- **Evidence**: The data backing it up (aggregates only)
- **Context**: Why it matters
- **Recommendation**: What to do next
- **Visualization Option**: "Would you like to see this as [chart type]?"

## Data Context Available
You can reference:
- Spending by category, vendor, department, year
- Vendor concentration and market share trends
- Cost growth rates year-over-year
- Benchmarks for contract rates by category
- Historical trends (5+ years of data)

Never claim to have individual contract-level details you haven't been given.`;

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

    return {
      message: assistantMessage,
      insights: extractInsights(assistantMessage),
      suggestedActions: extractActions(assistantMessage),
      dataReferences: contractContext,
      visualization: extractVisualizationRequest(assistantMessage),
    };
  } catch (error) {
    console.error('Chat handler error:', error);
    throw error;
  }
}

function extractInsights(text) {
  const insightMatches = text.match(/Finding:|Insight:|The key finding is:|Evidence:|Key data:/gi);
  return insightMatches ? insightMatches.length : [];
}

function extractActions(text) {
  const actionMatches = text.match(/(?:should|recommend|suggest|action|next step):[^.!?]*[.!?]/gi);
  return actionMatches ? actionMatches.map((m) => m.trim()) : [];
}

function extractVisualizationRequest(text) {
  const vizMatch = text.match(/(?:would you like|want to see|see this as)\s+(?:a|this as)\s+([^?]+)\?/i);
  return vizMatch ? { type: vizMatch[1], mentioned: true } : null;
}
