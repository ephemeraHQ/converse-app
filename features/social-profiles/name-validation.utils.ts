import { ENS_REGEX, UNS_REGEX } from "@/utils/regex"

/**
 * Validates if a string is a valid ENS name
 */
export function isValidEnsName(name: string | undefined): boolean {
  if (!name) {
    return false
  }
  return ENS_REGEX.test(name)
}

/**
 * Validates if a string is a valid Base name
 * Base names follow the same pattern as ENS names
 */
export function isValidBaseName(name: string | undefined): boolean {
  if (!name) {
    return false
  }
  // Base names must end with .eth and contain .base
  return name.includes(".base") && name.endsWith(".eth")
}

/**
 * Validates if a string is a valid Unstoppable Domain name
 */
export function isValidUnstoppableDomainName(name: string | undefined): boolean {
  if (!name) {
    return false
  }
  return UNS_REGEX.test(name)
}
