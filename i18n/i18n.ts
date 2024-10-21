import * as Localization from "expo-localization";
// eslint-disable-next-line no-restricted-imports
import i18n from "i18n-js";
import { I18nManager } from "react-native";

import en, { Translations } from "./translations/en";

export { i18n };
// import fr from "./translations/fr";

i18n.fallbacks = true;

// to use regional locales use { "en-US": enUS } etc
i18n.translations = {
  en,
  "en-US": en,
  // fr
};

/**
 * Sets the default separator for nested translation keys.
 *
 * Note: This separator const is used to provide autocomplete
 * and TypeScript support for nested strings in our translation
 * file.
 *
 * Uses '::' to allow English sentences as keys while
 * still supporting nested structures. This choice avoids
 * conflicts with standard punctuation and is visually
 * distinct.
 *
 * @example
 * // With nested translations object:
 * {
 *   "menu": {
 *     "File": "File",
 *     "Open recent": {
 *       "No recent files": "No recent files"
 *     }
 *   }
 * }
 * // Access nested key:
 * i18n.t("menu::File") // Returns "File"
 * i18n.t("menu::Open recent::No recent files")
 * // Returns "No recent files"
 *
 * @example
 * // Using English sentences as keys:
 * i18n.t("Hello, how are you?") // Works as-is
 * i18n.t("menu::Edit::Cut") // Nested structure
 *
 * @sideEffects
 * - Changes how nested keys are accessed in translations
 * - Existing translation key strings may need updating
 * -- Regex to find foo.bar.strings: translate\(.*\..*"\)
 */
// export const TranslationNestedSeparator = "::" as const;
export const TranslationNestedSeparator = "." as const;

i18n.defaultSeparator = TranslationNestedSeparator;

const fallbackLocale = "en-US";
const systemLocale = Localization.getLocales()[0];
const systemLocaleTag = systemLocale?.languageTag ?? "en-US";

if (Object.prototype.hasOwnProperty.call(i18n.translations, systemLocaleTag)) {
  // if specific locales like en-FI or en-US is available, set it
  i18n.locale = systemLocaleTag;
} else {
  // otherwise try to fallback to the general locale (dropping the -XX suffix)
  const generalLocale = systemLocaleTag.split("-")[0];
  if (Object.prototype.hasOwnProperty.call(i18n.translations, generalLocale)) {
    i18n.locale = generalLocale;
  } else {
    i18n.locale = fallbackLocale;
  }
}

// handle RTL languages
export const isRTL = systemLocale?.textDirection === "rtl";
I18nManager.allowRTL(isRTL);
I18nManager.forceRTL(isRTL);

/**
 * Builds up valid keypaths for translations.
 */
export type TxKeyPath = RecursiveKeyOf<Translations>;

// via: https://stackoverflow.com/a/65333050
type RecursiveKeyOf<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: RecursiveKeyOfHandleValue<
    TObj[TKey],
    `${TKey}`
  >;
}[keyof TObj & (string | number)];

type RecursiveKeyOfInner<TObj extends object> = {
  [TKey in keyof TObj & (string | number)]: RecursiveKeyOfHandleValue<
    TObj[TKey],
    `['${TKey}']` | `${typeof TranslationNestedSeparator}${TKey}`
  >;
}[keyof TObj & (string | number)];

type RecursiveKeyOfHandleValue<
  TValue,
  Text extends string,
> = TValue extends any[]
  ? Text
  : TValue extends object
  ? Text | `${Text}${RecursiveKeyOfInner<TValue>}`
  : Text;
