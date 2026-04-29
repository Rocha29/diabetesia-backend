const groqProvider = require("../providers/groqProvider");
const deepseekProvider = require("../providers/deepseekProvider");

const MAX_RETRIES = 1;

async function withRetry(label, fn, retries = MAX_RETRIES) {
  try {
    return await fn();
  } catch (err) {
    if (retries > 0) {
      console.warn(`[aiService] ${label} error, retrying (${retries} left): ${err.message}`);
      return withRetry(label, fn, retries - 1);
    }
    throw err;
  }
}

async function analyze(input) {
  console.log("[aiService] Calling Groq");
  try {
    return await withRetry("Groq", () => groqProvider.analyze(input));
  } catch (groqErr) {
    console.warn(`[aiService] Groq failed: ${groqErr.message} — falling back to DeepSeek`);
    return await withRetry("DeepSeek", () => deepseekProvider.analyze(input));
  }
}

module.exports = { analyze };
