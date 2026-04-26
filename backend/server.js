import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { countTokens, getProvider, getSupportedModels } from './tokenizers/index.js';
import { optimizePromptLLM, isLLMOptimizationAvailable } from './services/optimizerService.js';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

if (process.env.PORT) {
  console.log(`Using port from .env: ${process.env.PORT}`);
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Load pricing configuration
let pricingConfig;
try {
  pricingConfig = JSON.parse(
    fs.readFileSync('./pricing/pricingConfig.json', 'utf-8')
  );
} catch (error) {
  console.error('Failed to load pricing config:', error.message);
  pricingConfig = { models: {} };
}

// Calculate cost based on tokens and model pricing
function calculateCost(tokens, modelId) {
  const model = pricingConfig.models[modelId];
  if (!model) return 0;
  
  const costPerToken = model.inputPricePer1M / 1_000_000;
  return tokens * costPerToken;
}

// POST /api/analyze - Analyze tokens and cost for multiple models
app.post('/api/analyze', async (req, res) => {
  try {
    const { prompt, models, pageContent } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ 
        error: 'Prompt is required' 
      });
    }
    
    const combinedPrompt = pageContent 
      ? `${pageContent}\n\n${prompt}` 
      : prompt;
    
    const modelList = models && Array.isArray(models) 
      ? models 
      : Object.keys(pricingConfig.models).slice(0, 5);
    
    const results = await Promise.all(
      modelList.map(async (modelId) => {
        const tokens = await countTokens(combinedPrompt, modelId);
        const cost = calculateCost(tokens, modelId);
        const model = pricingConfig.models[modelId];
        
        return {
          model: modelId,
          modelName: model?.name || modelId,
          provider: model?.provider || getProvider(modelId),
          tokens,
          contextLimit: model?.context || 0,
          inputCost: cost,
          inputPricePer1M: model?.inputPricePer1M || 0,
          outputPricePer1M: model?.outputPricePer1M || 0,
        };
      })
    );
    
    res.json({
      success: true,
      prompt: combinedPrompt,
      results,
    });
  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message,
    });
  }
});

// POST /api/optimize - Optimize prompt using LLM
app.post('/api/optimize', async (req, res) => {
  try {
    const { prompt, mode } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Prompt is required'
      });
    }
    
    const optimizationMode = mode || 'safe';
    
    // Count original tokens
    const originalTokens = await countTokens(prompt, 'gpt-4o');
    const originalCost = calculateCost(originalTokens, 'gpt-4o');
    
    let optimizedPrompt;
    let optimizationCost = 0;
    
    // Use LLM optimization if API key is available
    if (isLLMOptimizationAvailable()) {
      try {
        optimizedPrompt = await optimizePromptLLM(prompt, optimizationMode);
        // Calculate cost of optimization (using gpt-4o-mini)
        const inputTokens = await countTokens(prompt, 'gpt-4o-mini');
        const outputTokens = await countTokens(optimizedPrompt, 'gpt-4o-mini');
        optimizationCost = (inputTokens * 0.00015) + (outputTokens * 0.0006);
      } catch (llmError) {
        console.error('LLM optimization failed, falling back to heuristic:', llmError.message);
        optimizedPrompt = heuristicOptimize(prompt, optimizationMode);
        optimizationCost = 0;
      }
    } else {
      // Fallback to heuristic-based optimization
      optimizedPrompt = heuristicOptimize(prompt, optimizationMode);
      optimizationCost = 0;
    }
    
    const optimizedTokens = await countTokens(optimizedPrompt, 'gpt-4o');
    const optimizedCost = calculateCost(optimizedTokens, 'gpt-4o');
    
    const reductionPercent = originalTokens > 0
      ? Math.round((1 - optimizedTokens / originalTokens) * 100)
      : 0;
    
    const savings = originalCost - optimizedCost;
    
    res.json({
      success: true,
      originalPrompt: prompt,
      optimizedPrompt,
      originalTokens,
      optimizedTokens,
      reductionPercent,
      optimizationCost,
      savings,
      mode: optimizationMode,
      disclaimer: isLLMOptimizationAvailable() 
        ? 'Prompt optimized using LLM (GPT-4o-mini via OpenRouter). Provider-accurate tokenization using official tokenizer. Final billed tokens may vary slightly due to provider formatting/system overhead.'
        : 'Heuristic-based optimization. For LLM-based optimization, add your OpenRouter API key to the .env file.',
    });
  } catch (error) {
    console.error('Optimize error:', error);
    res.status(500).json({
      error: 'Optimization failed',
      message: error.message,
    });
  }
});

// Heuristic-based prompt optimization (fallback when no LLM API available)
function heuristicOptimize(text, mode) {
  if (!text || typeof text !== 'string') return '';
  
  let optimized = text;
  
  if (mode === 'safe') {
    optimized = optimized
      .replace(/```[\s\S]*?```/g, (match) => `[CODE: ${match.replace(/```\w*\n?/g, '').trim().length} chars]`)
      .replace(/`[^`]+`/g, '`x`')
      .replace(/\bplease\b/gi, '')
      .replace(/\bcan you\b/gi, '')
      .replace(/\bcould you\b/gi, '')
      .replace(/\bwould you\b/gi, '')
      .replace(/\bi want you to\b/gi, '')
      .replace(/\byou are a\b/gi, '')
      .replace(/\byour task is to\b/gi, '')
      .replace(/\byou need to\b/gi, '')
      .replace(/\bit is required that you\b/gi, '')
      .replace(/\bi need you to\b/gi, '')
      .replace(/\bkindly\b/gi, '')
      .replace(/\bbasically\b/gi, '')
      .replace(/\bactually\b/gi, '')
      .replace(/\bsimply\b/gi, '')
      .replace(/\bjust\b/gi, '')
      .replace(/\breally\b/gi, '')
      .replace(/\the following\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } else if (mode === 'aggressive') {
    optimized = optimized
      .replace(/```[\s\S]*?```/g, (match) => `[CODE: ${match.replace(/```\w*\n?/g, '').trim().length} chars]`)
      .replace(/`[^`]+`/g, '`x`')
      .replace(/\bplease\b/gi, '')
      .replace(/\bcan you\b/gi, '')
      .replace(/\bcould you\b/gi, '')
      .replace(/\bwould you\b/gi, '')
      .replace(/\bi want you to\b/gi, '')
      .replace(/\byou are a\b/gi, '')
      .replace(/\byour task is to\b/gi, '')
      .replace(/\byou need to\b/gi, '')
      .replace(/\bit is required that you\b/gi, '')
      .replace(/\bi need you to\b/gi, '')
      .replace(/\bkindly\b/gi, '')
      .replace(/\bbasically\b/gi, '')
      .replace(/\bactually\b/gi, '')
      .replace(/\bsimply\b/gi, '')
      .replace(/\bjust\b/gi, '')
      .replace(/\breally\b/gi, '')
      .replace(/\bliterally\b/gi, '')
      .replace(/\bdefinitely\b/gi, '')
      .replace(/\bcertainly\b/gi, '')
      .replace(/\bobviously\b/gi, '')
      .replace(/\bclearly\b/gi, '')
      .replace(/\bsure\b/gi, '')
      .replace(/\bwell\b/gi, '')
      .replace(/\bof course\b/gi, '')
      .replace(/\bas you know\b/gi, '')
      .replace(/\byou understand\b/gi, '')
      .replace(/\bi was wondering\b/gi, '')
      .replace(/\bi wanted to ask\b/gi, '')
      .replace(/\the following\b/gi, '')
      .replace(/\bin order to\b/gi, 'to')
      .replace(/\bdue to the fact that\b/gi, 'because')
      .replace(/\bat this point in time\b/gi, 'now')
      .replace(/\bin the event that\b/gi, 'if')
      .replace(/\bfor the purpose of\b/gi, 'to')
      .replace(/\bwith regard to\b/gi, 'about')
      .replace(/\bin regards to\b/gi, 'about')
      .replace(/, and /gi, ', ')
      .replace(/, as well as /gi, ', ')
      .replace(/\s{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } else if (mode === 'clarity') {
    optimized = optimized
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{2,}/g, ' ')
      .trim();
  } else if (mode === 'performance') {
    optimized = optimized
      .replace(/^/gm, '1. ')
      .replace(/\n/g, '\n2. ')
      .replace(/\n2\. $/gm, '')
      .trim();
  }
  
  return optimized;
}

// GET /api/models - Get supported models
app.get('/api/models', (req, res) => {
  res.json({
    models: getSupportedModels(),
    pricing: pricingConfig,
  });
});

// GET /api/health - Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Toknify API running on http://localhost:${PORT}`);
});