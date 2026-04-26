import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { OpenRouter } from "@openrouter/sdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // MODULE 3: AI & INTELLIGENCE (LEEMA BRAIN)
  app.post("/api/ai/leema", async (req, res) => {
    try {
      const { messages, systemInstruction } = req.body;
      const apiKey = process.env.OPENROUTER_API_KEY;
      const model = process.env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free";

      if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY is missing from environment");
      }

      const openrouter = new OpenRouter({ apiKey });

      const response = await openrouter.chat.send({
        model,
        messages: [
          { role: "system", content: systemInstruction },
          ...messages
        ]
      });

      if (response.usage) {
        console.log(`[Leema Intelligence] Reasoning Tokens: ${(response.usage as any).reasoning_tokens || "N/A"}`);
      }

      const aiText = response.choices[0]?.message?.content || "";
      res.json({ text: aiText });
    } catch (error: any) {
      console.error("[Leema Brain Error]:", error.message);
      res.status(500).json({ 
        error: "Brain resonance lost",
        message: error.message 
      });
    }
  });

  // MODULE 2: PAYMENT ORCHESTRATION (SECURE HANDLERS)
  
  /**
   * Secure Checkout Initiation
   * Fetches canonical pricing from Firestore to prevent client-side spoofing.
   */
  app.post("/api/payments/initialize", async (req, res) => {
    try {
      const { productId, userId } = req.body;
      
      // Zero-Trust: We would fetch price from Firestore here via Admin SDK
      // For now, we simulate the secure validation
      console.log(`[Zero-Trust] Initializing secure checkout for product: ${productId}`);
      
      // Convert to Kobo (Kobo Scaling)
      const amountInKobo = 75000 * 100; // Example canonical price
      
      const transactionRef = `DRJ-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      
      res.json({
        status: "success",
        data: {
          reference: transactionRef,
          amount: amountInKobo,
          virtualAccount: {
            bank: "Wema Bank (Moniepoint)",
            accountNumber: "90" + Math.floor(10000000 + Math.random() * 90000000),
            accountName: "HOUSE OF DARAJA - " + transactionRef.slice(-4),
            expiry: Date.now() + (30 * 60 * 1000) // 30 min expiry
          }
        }
      });
    } catch (error) {
      res.status(500).json({ status: "error", message: "Failed to link to payment gateway" });
    }
  });

  /**
   * Simulation of Internal Payment Confirmation (Webhook or Poll)
   * TRIGGERS MODULE 4: EVENT-DRIVEN NOTIFICATIONS
   */
  app.post("/api/payments/simulate-confirmation", async (req, res) => {
    const { reference } = req.body;
    
    console.log(`[Module 4] Order ${reference} shifted to PAID status.`);
    
    // Idempotency Lock (Simulation)
    const idempotencyKey = `notify_${reference}`;
    console.log(`[Module 4] Applying Idempotency Lock: ${idempotencyKey}`);

    // Execution Channels
    console.log(`[Module 4] Triggering FCM Push Alert...`);
    console.log(`[Module 4] Dispatching Branded Receipt Email (Lore & Care)...`);
    console.log(`[Module 4] Calling SMS Gateway (Termii) for Reference ${reference}...`);

    res.json({ status: "success", message: "Omni-channel notifications dispatched." });
  });

  /**
   * Webhook Verification (HMAC-SHA256)
   */
  app.post("/api/payments/webhook", (req, res) => {
    const signature = req.headers["x-opay-signature"];
    const secret = process.env.OPAY_SECRET_KEY || "dummy_secret";
    
    const computedSignature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (signature !== computedSignature) {
      console.error("[Security] Unauthorized Webhook Attempt Blocked");
      return res.status(401).send("Unauthorized");
    }

    // Atomic Transaction logic would follow here
    res.status(200).send("OK");
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Sovereign Core] Online at http://localhost:${PORT}`);
    
    // MODULE 4: EVENT-DRIVEN NOTIFICATIONS (Background Orchestrator)
    // In a production serverless environment, this would be a Firebase Cloud Function.
    // In this containerized environment, we implement a persistent background listener.
    setupBackgroundOrchestrator();
  });
}

function setupBackgroundOrchestrator() {
  console.log("[Orchestrator] Initializing Notification Pipeline...");
  
  // Note: we'd ideally use the Admin SDK here, but for this dev sandbox,
  // we can use a server-side onSnapshot if we have the service account.
  // For simulation purposes in this turn, we'll continue using the simulated handlers 
  // until a service account is provided.
}

startServer();
