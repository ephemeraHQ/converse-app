import { translate } from "@/i18n"

export type ValidationResult = {
  isValid: boolean
  error?: string
}

/**
 * Rules for validating profile names
 * Each rule should return undefined if valid, or an error message if invalid
 */
const validationRules: Array<(name: string) => ValidationResult> = [
  // Rule: No dots allowed
  (name: string) => ({
    isValid: !name.includes("."),
    error: name.includes(".")
      ? translate("userProfile.inputs.displayName.errors.noDots")
      : undefined,
  }),
]

/**
 * Validates a profile name against a set of rules
 * @param name The profile name to validate
 * @returns ValidationResult indicating if the name is valid and any error message
 */
export function validateCustomProfileDisplayName(
  name: string,
): ValidationResult {
  for (const rule of validationRules) {
    const result = rule(name)
    if (!result.isValid) {
      return result
    }
  }

  return { isValid: true }
}
