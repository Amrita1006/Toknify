// Llama tokenizer - uses BPE tokenization similar to GPT
// Llama models use byte-level BPE

export async function countTokens(prompt, model) {
  if (!prompt || typeof prompt !== 'string') {
    return 0;
  }
  
  try {
    // Llama uses a similar encoding structure to GPT
    // Use cl100k_base as base approximation
    const enc = await import('tiktoken').then(m => 
      m.getEncoding('cl100k_base')
    );
    
    const tokens = enc.encode(prompt);
    const tokenCount = tokens.length;
    
    enc.free();
    
    // Llama has minimal overhead (~3-5 tokens per message)
    return tokenCount + 3;
  } catch (error) {
    console.error(`Llama tokenization error:`, error.message);
    return Math.ceil(prompt.length / 4) + 3;
  }
}

export function getProvider() {
  return 'Meta';
}

export function isSupported(model) {
  return model.startsWith('llama-');
}