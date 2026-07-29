import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (enText: string, arText: string) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Grab saved language preference, or default to English
 const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('homiyaa_lang') as Language) || 'ar';
  });

  const isRtl = language === 'ar';

  useEffect(() => {
    localStorage.setItem('homiyaa_lang', language);
    // Dynamically change the HTML document direction and lang attribute
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRtl]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  // Helper translation function to easily choose fields inline
  const t = (enText: string, arText: string) => {
    return isRtl ? arText : enText;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};