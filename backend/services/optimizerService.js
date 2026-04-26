import OpenAI from 'openai';

let client = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (apiKey && apiKey !== 'your_openrouter_api_key_here') {
      client = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey,
      });
    }
  }
  return client;
}

const OPTIMIZATION_PROMPTS = {
  safe: `Rewrite the following prompt to reduce token count while preserving intent, constraints, examples, and formatting requirements. Remove redundancy and verbosity without changing meaning. Output ONLY the optimized prompt, no explanations.`,

  aggressive: `Rewrite the following prompt to be as concise as possible while preserving the core intent, key constraints, examples, and output format. Remove all filler words, redundant phrases, and unnecessary politeness. Direct commands only. Output ONLY the optimized prompt, no explanations.`,

  clarity: `Rewrite the following prompt for maximum clarity. Use precise language, clear instructions, and well-structured formatting. Preserve all constraints and requirements. Output ONLY the optimized prompt, no explanations.`,

  performance: `Rewrite the following prompt to optimize for LLM performance. Use clear role definition, specific output format, step-by-step instructions if needed, and include relevant context. Prioritize clarity and actionability. Output ONLY the optimized prompt, no explanations.`,
};

export async function optimizePromptLLM(prompt, mode = 'safe') {
  const openaiClient = getClient();
  
  if (!openaiClient) {
    throw new Error('OpenRouter API key not configured');
  }

  const instruction = OPTIMIZATION_PROMPTS[mode] || OPTIMIZATION_PROMPTS.safe;

  const response = await openaiClient.chat.completions.create({
    model: 'openai/gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: instruction,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.2,
    max_tokens: 4096,
  });

  return response.choices[0].message.content;
}

export function isLLMOptimizationAvailable() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  return !!(apiKey && apiKey !== 'your_openrouter_api_key_here');
}