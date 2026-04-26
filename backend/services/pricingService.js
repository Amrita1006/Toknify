import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let pricingConfig = null;

export function loadPricingConfig() {
  if (pricingConfig) {
    return pricingConfig;
  }

  try {
    const configPath = path.join(__dirname, '../pricing/pricingConfig.json');
    pricingConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return pricingConfig;
  } catch (error) {
    console.error('Failed to load pricing config:', error.message);
    return { models: {} };
  }
}

export const MODEL_REGISTRY = [
  {
    id: 'gpt-4o',
    provider: 'openai',
    name: 'GPT-4o',
    inputPrice: 0.005,
    outputPrice: 0.015,
    context: 128000,
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    name: 'GPT-4o Mini',
    inputPrice: 0.00015,
    outputPrice: 0.0006,
    context: 128000,
  },
  {
    id: 'claude-3-5-sonnet',
    provider: 'anthropic',
    name: 'Claude 3.5 Sonnet',
    inputPrice: 0.003,
    outputPrice: 0.015,
    context: 200000,
  },
  {
    id: 'claude-3-5-haiku',
    provider: 'anthropic',
    name: 'Claude 3.5 Haiku',
    inputPrice: 0.00025,
    outputPrice: 0.00125,
    context: 200000,
  },
  {
    id: 'gemini-1.5-flash',
    provider: 'google',
    name: 'Gemini 1.5 Flash',
    inputPrice: 0.000075,
    outputPrice: 0.0003,
    context: 1000000,
  },
  {
    id: 'gemini-1.5-pro',
    provider: 'google',
    name: 'Gemini 1.5 Pro',
    inputPrice: 0.00125,
    outputPrice: 0.005,
    context: 2000000,
  },
];

export function getModelById(modelId) {
  const config = loadPricingConfig();
  const modelData = config.models[modelId];
  
  if (modelData) {
    return {
      id: modelData.id,
      provider: modelData.provider?.toLowerCase() || 'openai',
      name: modelData.name,
      inputPrice: modelData.inputPricePer1M / 1_000_000,
      outputPrice: modelData.outputPricePer1M / 1_000_000,
      context: modelData.context,
    };
  }

  return MODEL_REGISTRY.find(m => m.id === modelId) || null;
}

export function calculateCost(tokens, modelId, isOutput = false) {
  const model = getModelById(modelId);
  if (!model) return 0;

  const pricePerToken = isOutput ? model.outputPrice : model.inputPrice;
  return tokens * pricePerToken;
}