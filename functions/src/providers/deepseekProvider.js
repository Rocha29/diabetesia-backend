const https = require("https");
const { buildFoodAnalysisPrompt, normalizeResponse } = require("../prompts/analyzePrompt");

const MODEL = "deepseek-chat";
const TIMEOUT_MS = 20000;

function post(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request(
      {
        hostname: "api.deepseek.com",
        path: "/chat/completions",
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          try { resolve(JSON.parse(raw)); }
          catch { reject(new Error("Invalid JSON from DeepSeek: " + raw.slice(0, 200))); }
        });
      }
    );
    req.setTimeout(TIMEOUT_MS, () => { req.destroy(new Error("DeepSeek request timeout")); });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function extractJson(raw) {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in DeepSeek response");
  return JSON.parse(match[0]);
}

async function analyze({ text, imageBase64 }) {
  if (!process.env.DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY is not set");

  // DeepSeek chat does not support vision — include note so the model still estimates from text
  const userContent = [
    text ?? "",
    imageBase64 ? "(Uma imagem foi enviada mas não pode ser processada por este modelo. Baseie a análise apenas no texto fornecido.)" : "",
  ]
    .filter(Boolean)
    .join("\n");

  const payload = {
    model: MODEL,
    messages: [
      { role: "system", content: buildFoodAnalysisPrompt({ hasImage: false }) },
      { role: "user", content: userContent },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
    max_tokens: 512,
  };

  const data = await post(payload);
  if (data.error) throw new Error(`DeepSeek API error: ${data.error.message}`);

  const raw = extractJson(data.choices[0].message.content);
  return normalizeResponse(raw);
}

module.exports = { analyze };
