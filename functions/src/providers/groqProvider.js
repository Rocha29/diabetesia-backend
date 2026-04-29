const https = require("https");
const { buildFoodAnalysisPrompt, normalizeResponse } = require("../prompts/analyzePrompt");

const TEXT_MODEL = "llama-3.3-70b-versatile";
const VISION_MODEL = "llama-3.2-11b-vision-preview";
const TIMEOUT_MS = 15000;

function post(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request(
      {
        hostname: "api.groq.com",
        path: "/openai/v1/chat/completions",
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          try { resolve(JSON.parse(raw)); }
          catch { reject(new Error("Invalid JSON from Groq: " + raw.slice(0, 200))); }
        });
      }
    );
    req.setTimeout(TIMEOUT_MS, () => { req.destroy(new Error("Groq request timeout")); });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function buildMessages({ text, imageBase64 }) {
  const systemPrompt = buildFoodAnalysisPrompt({ hasImage: !!imageBase64 });

  if (imageBase64) {
    // Vision models don't support a separate system role — embed prompt in user content
    return [
      {
        role: "user",
        content: [
          { type: "text", text: systemPrompt + (text ? `\n\nAdditional context: ${text}` : "") },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        ],
      },
    ];
  }

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: text },
  ];
}

function extractJson(raw) {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in Groq response");
  return JSON.parse(match[0]);
}

async function analyze({ text, imageBase64 }) {
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is not set");

  const model = imageBase64 ? VISION_MODEL : TEXT_MODEL;
  const payload = {
    model,
    messages: buildMessages({ text, imageBase64 }),
    temperature: 0.2,
    max_tokens: 512,
    // json_object mode is not supported on vision models
    ...(imageBase64 ? {} : { response_format: { type: "json_object" } }),
  };

  const data = await post(payload);
  if (data.error) throw new Error(`Groq API error: ${data.error.message}`);

  const raw = extractJson(data.choices[0].message.content);
  return normalizeResponse(raw);
}

module.exports = { analyze };
