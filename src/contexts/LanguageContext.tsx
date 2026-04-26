import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SUPPORTED_LANGUAGES } from '../services/TranslationService';
import { Product } from '../types';

const UI_STRINGS: Record<string, Record<string, string>> = {
  en: {
    motto: 'Wear Your Worth',
    mission: 'To build a powerful bridge between African heritage and modern global culture by creating, curating, and distributing premium fashion, media, and digital experiences that elevate identity, empower creators, and unlock economic opportunity.',
    vision: 'To become Africa’s most influential cultural bridge—connecting tradition, creativity, and innovation to the world, while setting the standard for luxury, identity, and impact.',
    archives: 'The Archives',
    explore: 'Explore Archives',
    identity: 'Identity Protocol',
    network: 'Merchant Network',
    sovereignty: 'Archive Sovereignty',
    active_drop: 'Active Drop Protocol',
    acquisition: 'Initialize Acquisition',
    latest_arrivals: 'New Archives',
    heritage: 'Evolving Heritage',
    heritage_desc: "Securing the future of Kano's royal textile tradition through decentralized provenance and high-fidelity archival."
  },
  ha: {
    motto: 'Saka Kimar Ka',
    mission: 'Gina ƙaƙƙarfan gada tsakanin al’adun Afirka da al’adun duniya na zamani ta hanyar ƙirƙira, tsarawa, da rarraba ingantattun kayan ado, kafofin watsa labarai, da ayyukan dijital waɗanda ke haɓaka asali, da buɗe damar tattalin arziki.',
    vision: 'Kasancewa gada mafi tasiri a Afirka—haɗa al’ada, ƙirƙira, da sabbin abubuwa ga duniya, tare da kafa ma’auni na alatu, asali, da tasiri.',
    archives: 'Taskar Kayayyaki',
    explore: 'Bincika Taskar',
    identity: 'Shaidar Shiga',
    network: 'Hanyar Yan Kasuwa',
    sovereignty: 'Mulkin Ajiya',
    active_drop: 'Kayayyakin Musamman',
    acquisition: 'Fara Sayayya',
    latest_arrivals: 'Sabbin Adana',
    heritage: 'Habaka Gadonmu',
    heritage_desc: "Kiyaye makomar dinkin sarautar Kano ta hanyar shaidar zamani da adana abubuwan tarihi."
  },
  ar: {
    motto: 'ارتدِ قيمتك',
    mission: 'لبناء جسر قوي بين التراث الأفريقي والثقافة العالمية الحديثة من خلال إنشاء ورعاية وتوزيغ تجارب الموضة والوسائط الرقمية المتميزة التي ترفع الهوية وتمكن المبدعين وتفتح الفرص الاقتصادية.',
    vision: 'لتصبح الجسر الثقافي الأكثر تأثيراً في أفريقيا - يربط بين التقاليد والإبداع والابتكار للعالم ، مع وضع المعايير للفخامة والهوية والتأثير.',
    archives: 'الأرشيف',
    explore: 'استكشف الأرشيف',
    identity: 'بروتوكول الهوية',
    network: 'شبكة التجار',
    sovereignty: 'سيادة الأرشيف',
    active_drop: 'بروتوكول الطرح النشط',
    acquisition: 'بدء الاستحواذ',
    latest_arrivals: 'الأرشيفات الجديدة',
    heritage: 'تطور التراث',
    heritage_desc: "تأمين مستقبل تقاليد نسيج كانو الملكية من خلال إثبات المنشأ اللامركزي والأرشفة عالية الدقة."
  },
  // Adding placeholders for others, to be expanded if needed or handled by AI
  yo: {
    archives: 'Awọn Ile Isura',
    explore: 'Ṣawari Awọn Ile Isura',
    heritage: 'Itankalẹ Ohun-iní'
  },
  ig: {
    archives: 'Ebe Nchekwa',
    explore: 'Chọọ Ebe Nchekwa',
    heritage: 'Ọganihu Ihe Nketa'
  },
  fr: {
    archives: 'Les Archives',
    explore: 'Explorer les Archives',
    heritage: 'Héritage Évolutif'
  }
};

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  isRTL: boolean;
  t: (product: Product, field: 'title' | 'description') => string;
  ui: (key: keyof typeof UI_STRINGS['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLangState] = useState(() => {
    return localStorage.getItem('daraja_lang') || navigator.language.slice(0, 2) || 'en';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  const setLanguage = (lang: string) => {
    setLangState(lang);
    localStorage.setItem('daraja_lang', lang);
  };

  const ui = (key: keyof typeof UI_STRINGS['en']): string => {
    return UI_STRINGS[language]?.[key] || UI_STRINGS['en'][key];
  };

  const t = (product: Product, field: 'title' | 'description'): string => {
    if (language === 'en') return product[field];
    
    const translated = product.translations?.[language];
    if (translated && translated[field]) {
      return translated[field];
    }
    
    return product[field]; // Fallback to original
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL, t, ui }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
