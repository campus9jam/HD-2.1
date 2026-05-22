import express from "express";
import crypto from "crypto";
import { applySecurity } from "../security";

const app = express();
applySecurity(app);
app.use(express.json());

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

export default app;
