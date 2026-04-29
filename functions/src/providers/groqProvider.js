const OpenAI = require("openai");
const { SYSTEM_PROMPT } = require("../prompts/analyzePrompt");

const TEXT_MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "llama-3.2-11b-vision-preview";
const TIMEOUT_MS = 15000;

function getClient() {
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is not set");
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
    timeout: TIMEOUT_MS,
    maxRetries: 0,
  });
}

function buildMessages({ text, imageBase64 }) {
  if (imageBase64) {
    // Vision models don't accept a separate system role — fold prompt into user content
    const content = [
      { type: "text", text: SYSTEM_PROMPT + (text ? `\n\nUser input: ${text}` : "") },
      { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
    ];
    return [{ role: "user", content }];
  }
  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: text },
  ];
}

function extractJson(raw) {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in Groq response");
  return JSON.parse(match[0]);
}

async function analyze({ text, imageBase64 }) {
  const client = getClient();
  const model = imageBase64 ? VISION_MODEL : TEXT_MODEL;

  const completion = await client.chat.completions.create({
    model,
    messages: buildMessages({ text, imageBase64 }),
    temperature: 0.2,
    max_tokens: 256,
    // json_object mode not supported on vision models
    ...(imageBase64 ? {} : { response_format: { type: "json_object" } }),
  });

  return extractJson(completion.choices[0].message.content);
}

module.exports = { analyze };
