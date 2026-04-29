const usageService = require("../services/usageService");

async function rateLimiter(req, res, next) {
  try {
    const { allowed, used, limit } = await usageService.checkAndIncrement();

    res.set("X-Daily-Usage", `${used}/${limit}`);

    if (!allowed) {
      console.warn(`[rateLimiter] Daily limit reached: ${used}/${limit}`);
      return res.status(429).json({
        success: false,
        error: "Daily request limit reached. Try again tomorrow.",
        usage: { used, limit },
      });
    }

    console.log(`[rateLimiter] Request allowed: ${used}/${limit}`);
    next();
  } catch (err) {
    // Fail open: if Firestore is unavailable (e.g. local dev without emulator), allow the request
    console.warn("[rateLimiter] Could not check usage, proceeding:", err.message);
    next();
  }
}

module.exports = rateLimiter;
