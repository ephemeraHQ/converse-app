import { showSnackbar } from "@/components/Snackbar/Snackbar.service";
import logger from "@/utils/logger";

export function captureError(
  error: unknown,
  options?: {
    message?: string;
    caller?: string;
  }
) {
  const { message, caller } = options || {};
  const prefix = caller ? `[${caller}]` : message ? `${message}:` : "";

  if (prefix) {
    logger.error(prefix, error);
  } else {
    logger.error(error);
  }

  // Note: (thierry) Our logger is already sending error to Sentry
  // sentryTrackError(error, {
  //   message: options?.message,
  // });
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
