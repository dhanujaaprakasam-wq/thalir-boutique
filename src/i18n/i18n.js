import enProperties from './messages_en.properties?raw';
import taProperties from './messages_ta.properties?raw';

// Parser for Java/Standard .properties file syntax
export const parseProperties = (rawText) => {
  const result = {};
  if (!rawText) return result;
  
  const lines = rawText.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) {
      continue;
    }
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      result[key] = val;
    }
  }
  return result;
};

export const translations = {
  en: parseProperties(enProperties),
  ta: parseProperties(taProperties)
};

export const getTranslation = (lang = 'en', key, fallback = '') => {
  const dict = translations[lang] || translations.en;
  return dict[key] || translations.en[key] || fallback || key;
};
