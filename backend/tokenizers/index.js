import { countTokens as openAICount, getProvider as openAIProvider, isSupported as openAISupported } from './openaiTokenizer.js';
import { countTokens as anthropicCount, getProvider as anthropicProvider, isSupported as anthropicSupported } from './anthropicTokenizer.js';
import { countTokens as geminiCount, getProvider as geminiProvider, isSupported as geminiSupported } from './geminiTokenizer.js';
import { countTokens as llamaCount, getProvider as llamaProvider, isSupported as llamaSupported } from './llamaTokenizer.js';

const providerMap = {
  'OpenAI': openAICount,
  'Anthropic': anthropicCount,
  'Google': geminiCount,
  'Meta': llamaCount,
  'Mistral': llamaCount, // Use Llama tokenizer as fallback for Mistral
};

function getProviderForModel(model) {
  if (model.startsWith('gpt-') || model.startsWith('o')) return 'OpenAI';
  if (model.startsWith('claude-')) return 'Anthropic';
  if (model.startsWith('gemini-')) return 'Google';
  if (model.startsWith('llama-')) return 'Meta';
  if (model.startsWith('mistral-')) return 'Mistral';
  return 'OpenAI'; // Default
}

export async function countTokens(prompt, model) {
  if (!prompt || typeof prompt !== 'string') {
    return 0;
  }
  
  const provider = getProviderForModel(model);
  const countFn = providerMap[provider];
  
  if (countFn) {
    return countFn(prompt, model);
  }
  
  return Math.ceil(prompt.length / 4);
}

export function getProvider(model) {
  const provider = getProviderForModel(model);
  
  switch (provider) {
    case 'OpenAI': return openAIProvider();
    case 'Anthropic': return anthropicProvider();
    case 'Google': return geminiProvider();
    case 'Meta': return llamaProvider();
    case 'Mistral': return 'Mistral';
    default: return 'Unknown';
  }
}

export function getSupportedModels() {
  return [
    // OpenAI
    'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini',
    // Anthropic
    'claude-3-opus', 'claude-3-5-sonnet', 'claude-3-5-haiku', 'claude-3-haiku',
    // Google
    'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-lite',
    // Meta (Llama)
    'llama-3.1-8b-instruct', 'llama-3.1-70b-instruct', 'llama-3.1-405b-instruct',
    'llama-3.2-1b-instruct', 'llama-3.2-11b-instruct',
    // Mistral
    'mistral-small', 'mistral-medium', 'mistral-large',
  ];
}