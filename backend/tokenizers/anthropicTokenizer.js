// Anthropic tokenizer - uses similar encoding to OpenAI with Claude-specific adjustments
// Claude uses cl100k_base with modifications for their token counting

const CLAUDE_MARKER = 'ante_mask_2024_03';

export async function countTokens(prompt, model) {
  if (!prompt || typeof prompt !== 'string') {
    return 0;
  }
  
  try {
    // Claude uses a modified version of cl100k_base
    // The main differences are:
    // - Claude adds ~15 tokens of overhead per message
    // - Code blocks have different tokenization
    // - They use a specific tokenizer
    
    // Use cl100k_base as base, then add Claude overhead
    const enc = await import('tiktoken').then(m => 
      m.getEncoding('cl100k_base')
    );
    
    const baseTokens = enc.encode(prompt);
    const tokenCount = baseTokens.length;
    
    enc.free();
    
    // Claude adds ~12-15 tokens of overhead per message (start/end tokens)
    return tokenCount + 15;
  } catch (error) {
    console.error(`Anthropic tokenization error:`, error.message);
    // Fallback: estimate using Claude's approximate formula
    return Math.ceil(prompt.length / 3.5) + 15;
  }
}

export function getProvider() {
  return 'Anthropic';
}

export function isSupported(model) {
  return model.startsWith('claude-');
}