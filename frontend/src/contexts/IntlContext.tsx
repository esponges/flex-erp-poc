import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { IntlProvider as ReactIntlProvider } from 'react-intl';
import { messages, supportedLocales, defaultLocale, type SupportedLocale } from '@/locales';

interface IntlContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  isRTL: boolean;
}

const IntlContext = createContext<IntlContextType | undefined>(undefined);

interface IntlProviderProps {
  children: ReactNode;
}

export function IntlProvider({ children }: IntlProviderProps) {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    // Try to get locale from localStorage first
    const stored = localStorage.getItem('locale');
    if (stored && supportedLocales.includes(stored as SupportedLocale)) {
      return stored as SupportedLocale;
    }
    
    // Try to get locale from browser
    const browserLocale = navigator.language.split('-')[0];
    if (supportedLocales.includes(browserLocale as SupportedLocale)) {
      return browserLocale as SupportedLocale;
    }
    
    // Fall back to default locale
    return defaultLocale;
  });

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
    // Set HTML lang attribute for accessibility
    document.documentElement.lang = newLocale;
  };

  // Set initial HTML lang attribute
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Check if the current locale is RTL (for future expansion)
  const isRTL = false; // None of our current locales are RTL

  const contextValue: IntlContextType = {
    locale,
    setLocale,
    isRTL,
  };

  return (
    <IntlContext.Provider value={contextValue}>
      <ReactIntlProvider
        locale={locale}
        messages={messages[locale]}
        defaultLocale={defaultLocale}
        onError={(err) => {
          // Only log missing translation errors in development
          if (import.meta.env.DEV) {
            console.warn('React Intl Error:', err);
          }
        }}
      >
        {children}
      </ReactIntlProvider>
    </IntlContext.Provider>
  );
}

export function useIntlContext() {
  const context = useContext(IntlContext);
  if (context === undefined) {
    throw new Error('useIntlContext must be used within an IntlProvider');
  }
  return context;
}