const aiService = require("./aiService");

async function analyze({ text, imageBase64 }) {
  console.log("[analyzeService] Processing input", {
    textLength: text?.length ?? 0,
    hasImage: !!imageBase64,
  });

  return aiService.analyze({ text, imageBase64 });
}

module.exports = { analyze };
