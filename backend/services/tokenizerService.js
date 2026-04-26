import { encoding_for_model } from 'tiktoken';

const encodingCache = new Map();

function getEncoder(model) {
  if (encodingCache.has(model)) {
    return encodingCache.get(model);
  }

  try {
    const encoder = encoding_for_model(model);
    encodingCache.set(model, encoder);
    return encoder;
  } catch (error) {
    return null;
  }
}

export function countTokens(text, model) {
  if (!text || typeof text !== 'string') {
    return 0;
  }

  const encoder = getEncoder(model);

  if (encoder) {
    const tokens = encoder.encode(text);
    return tokens.length;
  }

  return Math.ceil(text.length / 4);
}

export async function countTokensUniversal(text, modelConfig) {
  if (!text || typeof text !== 'string') {
    return 0;
  }

  const { provider, id } = modelConfig;

  switch (provider) {
    case 'openai':
      return countTokens(text, id);
    case 'anthropic':
      return countAnthropicTokens(text);
    case 'google':
      return countGeminiTokens(text);
    default:
      return Math.ceil(text.length / 4);
  }
}

function countAnthropicTokens(text) {
  return Math.ceil(text.length / 4);
}

function countGeminiTokens(text) {
  return Math.ceil(text.length / 4);
}

export function freeEncoder(model) {
  if (encodingCache.has(model)) {
    const encoder = encodingCache.get(model);
    encoder.free();
    encodingCache.delete(model);
  }
}