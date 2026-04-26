import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ha', name: 'Hausa' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'ig', name: 'Igbo' },
  { code: 'fr', name: 'Français' },
  { code: 'ar', name: 'العربية' }
];

const GLOSSARY = [
  "House of Daraja",
  "Sahelian",
  "Origin Protocol",
  "Artifact",
  "Provenance",
  "Kano"
];

export async function translateProductContent(title: string, description: string, targetLangCode: string) {
  const targetLang = SUPPORTED_LANGUAGES.find(l => l.code === targetLangCode)?.name || targetLangCode;
  
  const prompt = `
    Translate the following luxury fashion product content into ${targetLang}.
    
    Product Title: "${title}"
    Product Description: "${description}"
    
    Glossary (These terms MUST remain exactly as written or use their premium cultural equivalent if specified):
    ${GLOSSARY.map(term => `- ${term}`).join('\n')}
    
    Rules:
    - Maintain a high-status, elegant, and luxury tone suitable for "House of Daraja" (a premium brand).
    - Use poetic or elevated vocabulary where appropriate.
    - Preserve formatting and meaning.
    - For West African languages (Hausa, Yoruba, Igbo), ensure cultural resonance with Sahelian/Royal aesthetics.
    - For Arabic, provide a formal, high-literature (Modern Standard Arabic) translation.
    - Score the luxury quality of your translation from 0.0 to 1.0 based on tone, elegance, and accuracy.
    
    Output format (JSON only):
    {
      "title": "translated title",
      "description": "translated description",
      "luxury_quality_score": 0.95
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      title: result.title || title,
      description: result.description || description,
      confidence: result.luxury_quality_score || 0.9
    };
  } catch (error) {
    console.error(`Translation Protocol Failure (${targetLangCode}):`, error);
    return { title, description, confidence: 0.0 }; // Fallback to original
  }
}

export { SUPPORTED_LANGUAGES };
