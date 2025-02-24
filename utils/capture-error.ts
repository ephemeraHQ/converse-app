import { showSnackbar } from "@/components/snackbar/snackbar.service";
import { logger } from "@/utils/logger";

export function captureError(error: unknown) {
  logger.error(error);
  // Note: (thierry) Our logger is already sending error to Sentry
  // sentryTrackError({ error });
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
