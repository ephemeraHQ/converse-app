// eslint-disable-next-line no-restricted-imports
import i18n from "i18n-js"
import { TxKeyPath } from "./i18n"

/**
 * Translates text.
 * @param {TxKeyPath | string} key - The i18n key or plain text.
 * @param {Record<string, any>} options - The i18n options.
 * @returns {string} - The translated text.
 */
export function translate(key: TxKeyPath | string, options?: Record<string, any>): string {
  // Get the current language's translations
  const translations = i18n.translations[i18n.locale]
  const enTranslations = i18n.translations.en

  // First try direct lookup, then fallback to path traversal
  let result =
    (translations as Record<string, any>)?.[key] ??
    key.split(".").reduce((obj, k) => obj?.[k], translations as any)

  // If no translation found in current locale, try English
  if (result === undefined) {
    result =
      (enTranslations as Record<string, any>)?.[key] ??
      key.split(".").reduce((obj, k) => obj?.[k], enTranslations as any)
  }

  // If still no translation found, return the key itself
  if (result === undefined) {
    result = key
  }

  // Handle interpolation if options are provided
  if (options) {
    Object.entries(options).forEach(([k, v]) => {
      result = result.replace(new RegExp(`{{${k}}}`, "g"), String(v))
    })
  }

  return result
}
