const OpenAI = require("openai");
const { SYSTEM_PROMPT } = require("../prompts/analyzePrompt");

const MODEL = "deepseek-chat";
const TIMEOUT_MS = 20000;

function getClient() {
  if (!process.env.DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY is not set");
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
    timeout: TIMEOUT_MS,
    maxRetries: 0,
  });
}

function extractJson(raw) {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in DeepSeek response");
  return JSON.parse(match[0]);
}

async function analyze({ text, imageBase64 }) {
  const client = getClient();

  // DeepSeek chat does not support vision — include a note when image is present
  const userContent = [
    text ?? "",
    imageBase64 ? "(An image was provided but cannot be processed by this model)" : "",
  ]
    .filter(Boolean)
    .join("\n");

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 256,
  });

  return extractJson(completion.choices[0].message.content);
}

module.exports = { analyze };
