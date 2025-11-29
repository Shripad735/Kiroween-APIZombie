import { Groq } from "groq-sdk";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '../.env' });

console.log("🧪 Testing Groq API Connection...\n");
console.log(
  "API Key:",
  process.env.GROQ_API_KEY
    ? `${process.env.GROQ_API_KEY.substring(0, 10)}...`
    : "NOT SET"
);
console.log("");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function testGroqAPI() {
  try {
    console.log("Sending test request to Groq API...\n");

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: 'Say "Hello, APIZombie!" in a friendly way.',
        },
      ],
      model: "moonshotai/kimi-k2-instruct-0905", // ✅ UPDATED MODEL
      temperature: 0.6,
      max_completion_tokens: 4096,
      top_p: 1,
      stream: true, // ✅ Streaming enabled
      stop: null,
    });

    console.log("✅ Streaming response:\n");

    for await (const chunk of chatCompletion) {
      process.stdout.write(chunk.choices[0]?.delta?.content || "");
    }

    console.log("\n\n--- Stream End ---\n");

  } catch (error) {
    console.error("❌ Error connecting to Groq API:");
    console.error("Message:", error.message);
    console.error("Status:", error.status);
    console.error("\nPlease check:");
    console.error("1. Your GROQ_API_KEY in the .env file");
    console.error("2. Model name is valid");
    console.error("3. Key is active: https://console.groq.com/keys");
  }
}

testGroqAPI();
