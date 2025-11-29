import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

console.log('🧪 Testing Groq API with Streaming...\n');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function testGroqStreaming() {
  try {
    console.log('Sending streaming request to Groq API...\n');
    console.log('Response: ');

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: 'Explain what APIZombie does in one sentence.',
        },
      ],
      model: 'mixtral-8x7b-32768',
      temperature: 0.6,
      max_tokens: 100,
      top_p: 1,
      stream: true,
      stop: null,
    });

    for await (const chunk of chatCompletion) {
      process.stdout.write(chunk.choices[0]?.delta?.content || '');
    }

    console.log('\n\n✅ Streaming test successful!');
  } catch (error) {
    console.error('\n❌ Error with streaming:');
    console.error('Message:', error.message);
    console.error('Status:', error.status);
    console.error('\nPlease check your GROQ_API_KEY in the .env file');
    console.error('Get a new key from: https://console.groq.com/keys');
  }
}

testGroqStreaming();
