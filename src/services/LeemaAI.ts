import { Product } from "../types";
import { db, handleFirestoreError } from "../lib/firebase";
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from "firebase/firestore";

export class LeemaAI {
  private history: any[] = [];
  private userId: string | null = null;

  constructor(private products: Product[], userId: string | null = null) {
    this.userId = userId;
  }

  async loadHistoryFromFirestore() {
    if (!this.userId) return;
    try {
      const q = query(
        collection(db, "chat_sessions"),
        where("userId", "==", this.userId),
        orderBy("timestamp", "desc"),
        limit(20)
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.reverse();
      this.history = docs.flatMap(doc => {
        const data = doc.data();
        return [
          { role: 'user', parts: [{ text: data.userMessage }] },
          { role: 'model', parts: [{ text: data.aiResponse }] }
        ];
      });
    } catch (e) {
      handleFirestoreError(e, 'list', 'chat_sessions');
    }
  }

  async sendMessage(message: string): Promise<string> {
    try {
      const systemInstruction = `
        You are Leema, the elite commerce and cultural concierge of House of Daraja. 
        BRAND CORE: "Wear Your Worth" — Sahelian royalty meets cyber-heritage.
        BEHAVIOR: Witty, relationship-first negotiator from Kano's Kurmi Market.
        AUCTION STRATEGIST: You advise on bidding strategies (e.g., "Wait for the sniped seconds", "Initialize the Collector Node auto-bid protocol").
        CAPABILITIES: You facilitate high-fidelity negotiations, heritage insights, and auction room analysis.
        CONTEXT: You have access to these artifacts: ${JSON.stringify(this.products.map(p => ({ id: p.id, title: p.title, price: p.price })))}.
        NEGOTIATION: If you agree on a price (usually no more than 15% discount), state it clearly.
      `;

      // Convert history for OpenRouter (role: user/assistant)
      const mappedHistory = this.history.map(h => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts ? h.parts[0].text : (h.content || "")
      }));

      const res = await fetch("/api/ai/leema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction,
          messages: [
            ...mappedHistory,
            { role: "user", content: message }
          ]
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Backend AI link failure");
      }
      
      const data = await res.json();
      const finalResponse = data.text || "Protocol resonance established.";

      // Check for price negotiation in text (Heuristic as we moved from strict tools)
      // If the model mentions a price acceptance for a product, we could trigger it here.
      // For now, we prioritize the linguistic experience requested.

      // Update local history
      this.history.push({ role: 'user', parts: [{ text: message }] });
      this.history.push({ role: 'model', parts: [{ text: finalResponse }] });

      // Persist to Firestore
      if (this.userId) {
        addDoc(collection(db, "chat_sessions"), {
          userId: this.userId,
          userMessage: message,
          aiResponse: finalResponse,
          timestamp: serverTimestamp()
        }).catch(err => handleFirestoreError(err, 'create', 'chat_sessions'));
      }

      return finalResponse;
    } catch (error) {
      console.error("Leema Brain Failure:", error);
      return "Linguistic resonance lost. Reconnecting to the Kano archives...";
    }
  }
}
