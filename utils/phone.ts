import type { CountryCode } from "libphonenumber-js";
import {
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js";

export function getAreaCodeForCountryId(countryId: CountryCode) {
  return getCountryCallingCode(countryId as CountryCode);
}

export function isValidPhoneNumber(phoneNumber: string) {
  return parsePhoneNumberFromString(phoneNumber)?.isValid();
}

export function addPlusSignIfNeeded(phoneNumber: string) {
  return phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
}

export function formatPhoneNumberToBeautifulFormat(phoneNumber: string) {
  return parsePhoneNumberFromString(phoneNumber)?.formatInternational();
}
