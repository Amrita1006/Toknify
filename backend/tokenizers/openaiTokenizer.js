import tiktoken from 'tiktoken';

const modelEncodings = {
  'gpt-4': 'cl100k_base',
  'gpt-4-turbo': 'cl100k_base',
  'gpt-4o': 'o200k_base',
  'gpt-4o-mini': 'o200k_base',
  'o1': 'o200k_base',
  'o1-mini': 'o200k_base',
  'claude-3-opus': 'cl100k_base',
  'claude-3-5-sonnet': 'cl100k_base',
  'claude-3-5-haiku': 'cl100k_base',
  'claude-3-haiku': 'cl100k_base',
};

const encodingCache = new Map();

async function getEncoding(encodingName) {
  if (encodingCache.has(encodingName)) {
    return encodingCache.get(encodingName);
  }
  
  try {
    const enc = tiktoken.encodingForModel(encodingName);
    
    if (enc) {
      encodingCache.set(encodingName, enc);
      return enc;
    }
    
    // Fallback to manual loading
    const fallback = tiktoken.getEncoding('cl100k_base');
    encodingCache.set(encodingName, fallback);
    return fallback;
  } catch (error) {
    console.error(`Failed to load encoding ${encodingName}:`, error.message);
    return null;
  }
}

export async function countTokens(prompt, model) {
  if (!prompt || typeof prompt !== 'string') {
    return 0;
  }
  
  try {
    const encodingName = modelEncodings[model] || 'cl100k_base';
    const enc = await getEncoding(encodingName);
    
    if (!enc) {
      return Math.ceil(prompt.length / 4);
    }
    
    const tokens = enc.encode(prompt);
    return tokens.length;
  } catch (error) {
    console.error(`Tokenization error for ${model}:`, error.message);
    return Math.ceil(prompt.length / 4);
  }
}

export function getProvider() {
  return 'OpenAI';
}

export function isSupported(model) {
  return modelEncodings.hasOwnProperty(model);
}

export function getSupportedModels() {
  return Object.keys(modelEncodings);
}