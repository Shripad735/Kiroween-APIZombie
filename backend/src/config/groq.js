import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Default model configuration
export const GROQ_CONFIG = {
  model: 'moonshotai/kimi-k2-instruct-0905', // Working model
  temperature: 0.6,
  max_completion_tokens: 4096,
  top_p: 1,
  stream: false, // Set to false for non-streaming responses
  stop: null,
};

// Alternative models for different use cases
export const GROQ_MODELS = {
  DEFAULT: 'moonshotai/kimi-k2-instruct-0905', // Default working model
  FAST: 'llama3-8b-8192', // Fastest, good for simple tasks
  BALANCED: 'mixtral-8x7b-32768', // Good balance
  POWERFUL: 'llama3-70b-8192', // Most capable, slower
};

export default groq;
