import en from './en.json';
import es from './es.json';

export type Language = 'en' | 'es';

type TranslationValue = string | Record<string, unknown>;
type Translations = Record<string, TranslationValue | Record<string, TranslationValue>>;

const translations: Record<Language, Translations> = { en, es };

/**
 * Get a nested translation key like "auth.login"
 */
export function t(lang: Language, key: string): string {
  const keys = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any = translations[lang];

  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      console.warn(`Translation key "${key}" not found for language "${lang}"`);
      return key;
    }
  }

  return typeof result === 'string' ? result : key;
}

export { en, es };
export default translations;
