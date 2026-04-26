// Gemini tokenizer - uses sentencepiece-based tokenization
// Gemini models use Google's SentencePiece tokenizers

export async function countTokens(prompt, model) {
  if (!prompt || typeof prompt !== 'string') {
    return 0;
  }
  
  try {
    // Gemini uses SentencePiece tokenization
    // Approximate using cl100k_base as fallback
    const enc = await import('tiktoken').then(m => 
      m.getEncoding('cl100k_base')
    );
    
    const tokens = enc.encode(prompt);
    const tokenCount = tokens.length;
    
    enc.free();
    
    // Gemini models typically have slightly different tokenization
    // Add ~5 tokens overhead for message formatting
    return Math.max(tokenCount, 1) + 5;
  } catch (error) {
    console.error(`Gemini tokenization error:`, error.message);
    return Math.ceil(prompt.length / 3.5) + 5;
  }
}

export function getProvider() {
  return 'Google';
}

export function isSupported(model) {
  return model.startsWith('gemini-');
}