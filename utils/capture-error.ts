import { showSnackbar } from "@/components/Snackbar/Snackbar.service";
import logger from "@/utils/logger";
import { sentryTrackError } from "@/utils/sentry";
import { isDev } from "@/utils/getEnv";

export function captureError(
  error: unknown,
  options?: {
    message?: string;
  }
) {
  if (isDev) {
    if (options?.message) {
      logger.error(`${options.message}:`, error);
    } else {
      logger.error(error);
    }
  }

  sentryTrackError(error, {
    message: options?.message,
  });
}

export function captureErrorWithToast(
  error: unknown,
  options?: {
    message?: string;
  }
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
