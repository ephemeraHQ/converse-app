import * as Localization from "expo-localization"
// eslint-disable-next-line no-restricted-imports
import i18n from "i18n-js"
import { I18nManager } from "react-native"
import { en, Translations } from "./translations/en"
import { fr } from "./translations/fr"

export { i18n }

i18n.fallbacks = true

// to use regional locales use { "en-US": enUS } etc
i18n.translations = {
  en,
  "en-US": en,
  fr,
}

const fallbackLocale = "en-US"
const systemLocale = Localization.getLocales()[0]
const systemLocaleTag = systemLocale?.languageTag ?? "en-US"

if (Object.prototype.hasOwnProperty.call(i18n.translations, systemLocaleTag)) {
  // if specific locales like en-FI or en-US is available, set it
  i18n.locale = systemLocaleTag
} else {
  // otherwise try to fallback to the general locale (dropping the -XX suffix)
  const generalLocale = systemLocaleTag.split("-")[0]
  if (Object.prototype.hasOwnProperty.call(i18n.translations, generalLocale)) {
    i18n.locale = generalLocale
  } else {
    i18n.locale = fallbackLocale
  }
}

// handle RTL languages
export const isRTL = systemLocale?.textDirection === "rtl"
I18nManager.allowRTL(isRTL)
I18nManager.forceRTL(isRTL)

/**
 * Builds up valid keypaths for translations.
 */
export type TxKeyPath = RecursiveKeyOf<Translations>

// via: https://stackoverflow.com/a/65333050
type RecursiveKeyOf<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: RecursiveKeyOfHandleValue<TObj[TKey], `${TKey}`>
}[keyof TObj & (string | number)]

type RecursiveKeyOfInner<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: RecursiveKeyOfHandleValue<
    TObj[TKey],
    `['${TKey}']` | `.${TKey}`
  >
}[keyof TObj & (string | number)]

type RecursiveKeyOfHandleValue<TValue, Text extends string> = TValue extends any[]
  ? Text
  : TValue extends object
    ? Text | `${Text}${RecursiveKeyOfInner<TValue>}`
    : Text
