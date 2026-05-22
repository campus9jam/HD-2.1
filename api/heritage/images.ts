import express from "express";
import { applySecurity } from "../security";

const app = express();
applySecurity(app);

app.get("/api/heritage/images", async (req, res) => {
  try {
    // Standard Sovereign Fetch Protocol
    const response = await fetch("https://3b0a246f-7f49-49de-98b2-722d7b863a97.mock.pstmn.io", {
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Archival connection failed: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("[Heritage API Sync Error]:", error.message);
    // Fallback response for resilience
    res.json({
      images: [
        "https://i.imgur.com/7QFYTZJ.png",
        "https://i.imgur.com/MA123T4.png",
        "https://i.imgur.com/S4l7lKP.png",
        "https://i.imgur.com/jNv9WE7.png",
        "https://i.imgur.com/2Xkwv9Y.png"
      ]
    });
  }
});

export default app;
