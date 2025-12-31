import { createContext, useContext, useState, useEffect } from 'react';
import { vi } from './vi';
import { en } from './en';

const I18nContext = createContext();

const translations = {
  vi,
  en
};

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'vi'; // Default to Vietnamese
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return value || key;
  };

  const switchLanguage = (lang) => {
    if (lang === 'vi' || lang === 'en') {
      setLanguage(lang);
    }
  };

  return (
    <I18nContext.Provider value={{ t, language, switchLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
