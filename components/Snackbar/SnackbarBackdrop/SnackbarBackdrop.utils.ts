import {
  SNACKBARS_MAX_VISIBLE,
  SNACKBAR_BACKDROP_ADDITIONAL_HEIGHT,
  SNACKBAR_BOTTOM_OFFSET,
  SNACKBAR_HEIGHT,
  SNACKBAR_LARGE_TEXT_HEIGHT,
  SNACKBAR_SPACE_BETWEEN_SNACKBARS,
} from "@components/Snackbar/Snackbar.constants";
import { useSnackbars } from "@components/Snackbar/Snackbar.service";

export const useGradientHeight = () => {
  const snackbars = useSnackbars();

  if (snackbars.length === 0) {
    return 0;
  }

  const gradientHeight = snackbars
    .slice(0, SNACKBARS_MAX_VISIBLE)
    .reduce(
      (acc, snackbar) =>
        acc +
        (snackbar.isMultiLine ? SNACKBAR_LARGE_TEXT_HEIGHT : SNACKBAR_HEIGHT) +
        SNACKBAR_SPACE_BETWEEN_SNACKBARS,
      SNACKBAR_BACKDROP_ADDITIONAL_HEIGHT + SNACKBAR_BOTTOM_OFFSET
    );

  return gradientHeight;
};
