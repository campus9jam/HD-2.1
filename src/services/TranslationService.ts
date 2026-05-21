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

export async function translateText(text: string, targetLangCode: string) {
  const targetLang = SUPPORTED_LANGUAGES.find(l => l.code === targetLangCode)?.name || targetLangCode;
  
  try {
    const response = await fetch('/api/neural/translate-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang })
    });

    if (!response.ok) throw new Error('Translation Protocol Desync');

    const result = await response.json();
    return result.translatedText || text;
  } catch (error) {
    console.error(`Translation Protocol Failure (${targetLangCode}):`, error);
    return text; // Fallback to original
  }
}

export async function translateProductContent(title: string, description: string, targetLangCode: string) {
  const targetLang = SUPPORTED_LANGUAGES.find(l => l.code === targetLangCode)?.name || targetLangCode;
  
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, targetLang })
    });

    if (!response.ok) throw new Error('Translation Protocol Desync');

    const result = await response.json();
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
