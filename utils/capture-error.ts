import { showSnackbar } from "@/components/snackbar/snackbar.service";
import { ensureError, FeedbackError, GenericError } from "@/utils/error";
import { logger } from "@/utils/logger";
import { sentryTrackError } from "@/utils/sentry";

export async function captureError(
  error: unknown,
  options: {
    extras?: Record<string, string>;
  } = {},
) {
  try {
    const { extras } = options;

    if (__DEV__) {
      if (extras) {
        logger.error(error, extras);
      } else {
        logger.error(error);
      }
    }

    if (error instanceof FeedbackError) {
      return;
    }

    sentryTrackError({
      error: ensureError(error),
      extras: {
        ...extras,
      },
    });
  } catch (error) {
    sentryTrackError({
      error: new GenericError({
        error,
        additionalMessage: "Failed to capture error",
      }),
    });
  }
}

export function captureErrorWithToast(
  error: unknown,
  options?: {
    message?: string;
  },
) {
  const { message } = options || {};

  captureError(error);

  const snackMessage =
    message || (error as Error)?.message || "Something went wrong";

  showSnackbar({
    message: snackMessage,
    type: "error",
  });
}

export function captureErrorWithFriendlyToast(error: unknown) {
  captureErrorWithToast(error, {
    message: "Something went wrong",
  });
}
