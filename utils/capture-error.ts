import { showSnackbar } from "@/components/snackbar/snackbar.service";
import { getXmtpLogs } from "@/features/xmtp/utils/xmtp-logs";
import {
  ensureError,
  FeedbackError,
  GenericError,
  XMTPError,
} from "@/utils/error";
import { logger } from "@/utils/logger";
import { MAX_SENTRY_STRING_SIZE, sentryTrackError } from "@/utils/sentry";
import { getLastBytes } from "./str";

export async function captureError(
  error: unknown,
  options: {
    extras?: Record<string, string>;
    includeXmtpLogs?: boolean;
  } = {},
) {
  try {
    const { extras, includeXmtpLogs } = options;

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

    let truncatedLogs: string | null = null;

    // Maybe add XMTP logs
    if (includeXmtpLogs || error instanceof XMTPError) {
      try {
        // Race between getting logs and 5 second timeout
        const logs = await Promise.race([
          getXmtpLogs(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("XMTP logs timeout")), 5000),
          ),
        ]);

        if (logs && typeof logs === "string") {
          truncatedLogs = getLastBytes(logs, MAX_SENTRY_STRING_SIZE);
        }
      } catch (e) {
        sentryTrackError({
          error: new GenericError({
            error: ensureError(e),
            additionalMessage: "Failed to capture XMTP logs",
          }),
        });
      }
    }

    sentryTrackError({
      error: ensureError(error),
      extras: {
        ...extras,
        ...(truncatedLogs && { xmtp_logs: truncatedLogs }),
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
