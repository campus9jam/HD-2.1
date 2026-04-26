import { Product } from "../types";
import { db, handleFirestoreError } from "../lib/firebase";
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp, doc, updateDoc, getDoc } from "firebase/firestore";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

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
        CAPABILITIES: You can negotiate prices and check inventory.
      `;

      const negotiatePrice = {
        name: "negotiate_price",
        description: "Respond to a user's price negotiation request. Checks if the reduction is reasonable.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            productId: { type: Type.STRING, description: "The ID of the artifact." },
            proposedPrice: { type: Type.NUMBER, description: "The price the user wants to pay." }
          },
          required: ["productId", "proposedPrice"]
        }
      };

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...this.history,
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: [negotiatePrice] }]
        }
      });

      let aiText = response.text || "";

      // Handle Tool Calls
      if (response.functionCalls) {
        for (const call of response.functionCalls) {
          if (call.name === 'negotiate_price') {
            const { productId, proposedPrice } = call.args as any;
            const product = this.products.find(p => p.id === productId);
            if (product) {
               const minAcceptable = product.price * 0.85; // 15% max discount
               if (proposedPrice >= minAcceptable) {
                 aiText = `The elders have consulted. A price of ₦${proposedPrice.toLocaleString()} is accepted for the ${product.title}. Identity ledger updated.`;
                 // Trigger UI update or state change if possible (via events)
                 window.dispatchEvent(new CustomEvent('leema:price_negotiated', { 
                   detail: { productId, newPrice: proposedPrice } 
                 }));
               } else {
                 aiText = `Ah, noble citizen, such an artifact commands a higher resonance. ₦${proposedPrice.toLocaleString()} is too low for the skill of our master weavers.`;
               }
            }
          }
        }
      }

      const finalResponse = aiText || "Protocol resonance established.";

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
