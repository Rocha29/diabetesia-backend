// TODO: replace mock with real AI provider (e.g. Gemini, OpenAI)
async function analyze({ text, imageBase64 }) {
  console.log("[analyzeService] Processing input", {
    textLength: text?.length ?? 0,
    hasImage: !!imageBase64,
  });

  // Mock response — real AI call goes here
  return {
    summary: "Mock analysis result",
    input: {
      text: text ?? null,
      hasImage: !!imageBase64,
    },
    suggestions: [],
    analyzedAt: new Date().toISOString(),
  };
}

module.exports = { analyze };
