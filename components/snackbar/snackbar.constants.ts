import { spacing } from "@theme/spacing"
import { initialWindowMetrics } from "react-native-safe-area-context"

export const SNACKBAR_HEIGHT = 50

export const SNACKBAR_LARGE_TEXT_HEIGHT = 100

export const SNACKBARS_MAX_VISIBLE = 3

export const SNACKBAR_SPACE_BETWEEN_SNACKBARS = spacing.sm

export const SNACKBAR_BACKDROP_ADDITIONAL_HEIGHT = SNACKBAR_LARGE_TEXT_HEIGHT

export const SNACKBAR_BOTTOM_OFFSET = initialWindowMetrics?.insets.bottom ?? spacing.md

export const SNACKBAR_BACKDROP_MAX_HEIGHT =
  SNACKBARS_MAX_VISIBLE * (SNACKBAR_LARGE_TEXT_HEIGHT + SNACKBAR_SPACE_BETWEEN_SNACKBARS) +
  SNACKBAR_BACKDROP_ADDITIONAL_HEIGHT +
  SNACKBAR_BOTTOM_OFFSET
