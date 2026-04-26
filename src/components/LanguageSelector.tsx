import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { SUPPORTED_LANGUAGES } from '../services/TranslationService';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all duration-300 group"
      >
        <Globe className="w-3.5 h-3.5 text-gold group-hover:rotate-12 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">{currentLang.name}</span>
        <ChevronDown className={`w-3 h-3 text-white/20 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-4 right-0 w-48 bg-navy/95 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden z-50 shadow-2xl shadow-black/50"
          >
            <div className="p-2 space-y-1">
              <div className="px-4 py-3 border-b border-white/5 mb-1">
                 <span className="text-[8px] font-black uppercase tracking-widest text-gold/40">Select Language</span>
              </div>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${
                    language === lang.code 
                      ? 'bg-gold text-navy' 
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-medium">{lang.name}</span>
                  {language === lang.code && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
