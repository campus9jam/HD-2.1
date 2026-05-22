import express from "express";
import { OpenRouter } from "@openrouter/sdk";
import { applySecurity } from "../security";

const app = express();
applySecurity(app);
app.use(express.json());

app.post("/api/media/classify", async (req, res) => {
  try {
    const { title, currentCategory } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.json({
        refinedCategory: currentCategory,
        tags: ["archive", "heritage"],
        summary: "AI enrichment skipped (Key missing)."
      });
    }

    const openrouter = new OpenRouter({ apiKey });
    const prompt = `Classify this cultural artifact from House of Daraja.
    Title: "${title}"
    Current Category: ${currentCategory}

    Return JSON: {
      "refinedCategory": "Dandali" | "Zare Global" | "Co-Creators",
      "tags": ["tag1", "tag2"],
      "summary": "One sentence poetic summary",
      "culturalContext": "Brief historical/cultural note",
      "hausaTitle": "...",
      "frenchTitle": "...",
      "arabicTitle": "..."
    }`;

    const response = await openrouter.chat.send({
      model: "google/gemma-4-31b-it:free",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content || "{}";
    res.json(JSON.parse(content));
  } catch (error) {
    res.status(500).json({ error: "Classification failed" });
  }
});

export default app;
