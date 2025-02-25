import { showSnackbar } from "@/components/snackbar/snackbar.service";
import { ensureError } from "@/utils/error";
import { logger } from "@/utils/logger";
import { sentryTrackError } from "@/utils/sentry";

export function captureError(
  error: unknown,
  options: {
    extras?: Record<string, string>;
  } = {},
) {
  const { extras } = options;

  if (__DEV__) {
    if (extras) {
      logger.error(error, extras);
    } else {
      logger.error(error);
    }
  }

  sentryTrackError({
    error: ensureError(error),
    extras,
  });
}

export function captureErrorWithToast(
  error: unknown,
  options?: {
    message?: string;
  },
) {
  const message =
    options?.message || (error as Error)?.message || `Something went wrong`;
  captureError(error);
  showSnackbar({
    message,
    type: "error",
  });
}

export function captureErrorWithFriendlyToast(error: unknown) {
  captureErrorWithToast(error, {
    message: "Something went wrong",
  });
}
