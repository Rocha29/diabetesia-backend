const express = require("express");
const analyzeRoutes = require("./routes/analyze");

const app = express();

app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "diabetesia-backend" });
});

app.use("/analyze", analyzeRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

module.exports = app;
