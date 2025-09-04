import enMessages from './en.json';
import esMessages from './es.json';

// Flatten nested objects for react-intl
function flattenMessages(nestedMessages: any, prefix = ''): Record<string, string> {
  const flattened: Record<string, string> = {};
  
  Object.keys(nestedMessages).forEach((key) => {
    const value = nestedMessages[key];
    const prefixedKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'string') {
      flattened[prefixedKey] = value;
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(flattened, flattenMessages(value, prefixedKey));
    }
  });
  
  return flattened;
}

export const messages = {
  en: flattenMessages(enMessages),
  es: flattenMessages(esMessages),
};

export const supportedLocales = ['en', 'es'] as const;
export type SupportedLocale = typeof supportedLocales[number];

export const defaultLocale: SupportedLocale = 'en';

export const localeNames = {
  en: 'English',
  es: 'Español',
} as const;