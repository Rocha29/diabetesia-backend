const { Router } = require("express");
const analyzeService = require("../services/analyzeService");

const router = Router();

router.post("/", async (req, res) => {
  const { text, imageBase64 } = req.body;

  console.log("[analyze] Request received", {
    hasText: !!text,
    hasImage: !!imageBase64,
  });

  if (!text && !imageBase64) {
    return res.status(400).json({
      success: false,
      error: "At least one of 'text' or 'imageBase64' is required",
    });
  }

  try {
    const data = await analyzeService.analyze({ text, imageBase64 });
    console.log("[analyze] Response sent successfully");
    return res.json({ success: true, data });
  } catch (err) {
    console.error("[analyze] Error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

module.exports = router;
