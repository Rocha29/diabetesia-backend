const VALID_GLYCEMIC_IMPACTS = ["baixo", "medio", "alto"];

function buildFoodAnalysisPrompt({ hasImage = false } = {}) {
  const imageNote = hasImage
    ? "You will receive an image of a meal. Identify all visible food items."
    : "You will receive a text description of a meal.";

  return `You are a clinical nutrition assistant specializing in diabetes management.
${imageNote}

Respond ONLY with a valid JSON object in this exact format:
{
  "meal_description": "brief overall description of the meal",
  "identified_foods": ["food item 1", "food item 2"],
  "carbs_estimate_grams": <number>,
  "glycemic_impact": "<baixo|medio|alto>",
  "confidence": <number between 0.0 and 1.0>
}

Glycemic impact guide:
- "baixo": GI below 55 — vegetables, legumes, most fruits, nuts
- "medio": GI 55–70 — whole grains, oats, brown rice, yogurt
- "alto":  GI above 70 — white bread, pizza, white rice, sugary drinks, fruit juice

If the image is inconclusive or no food can be identified:
- Set identified_foods to []
- Set carbs_estimate_grams to 0
- Set glycemic_impact to "baixo"
- Set confidence to 0.1
- Set meal_description to "Não foi possível identificar a refeição"

Rules:
- carbs_estimate_grams must be a number (grams), never a string
- confidence: 0.9+ if very certain, 0.5–0.89 if moderate, below 0.5 if uncertain
- Do not include any text outside the JSON object`;
}

const INCONCLUSIVE_FALLBACK = {
  meal_description: "Não foi possível identificar a refeição",
  identified_foods: [],
  carbs_estimate_grams: 0,
  glycemic_impact: "baixo",
  confidence: 0.1,
};

function normalizeResponse(data) {
  return {
    meal_description:
      typeof data.meal_description === "string" && data.meal_description.trim()
        ? data.meal_description.trim()
        : INCONCLUSIVE_FALLBACK.meal_description,

    identified_foods: Array.isArray(data.identified_foods)
      ? data.identified_foods.filter((f) => typeof f === "string")
      : [],

    carbs_estimate_grams:
      typeof data.carbs_estimate_grams === "number" && data.carbs_estimate_grams >= 0
        ? data.carbs_estimate_grams
        : 0,

    glycemic_impact: VALID_GLYCEMIC_IMPACTS.includes(data.glycemic_impact)
      ? data.glycemic_impact
      : "baixo",

    confidence:
      typeof data.confidence === "number"
        ? Math.min(1, Math.max(0, data.confidence))
        : 0.1,
  };
}

module.exports = { buildFoodAnalysisPrompt, normalizeResponse, INCONCLUSIVE_FALLBACK };
