import { getEnv, isProd } from "@/utils/getEnv";
import * as Sentry from "@sentry/react-native";
import type { Breadcrumb, ErrorEvent, EventHint } from "@sentry/types";
import { config } from "../config";

// Error patterns that should not be reported to Sentry
type ErrorFilter = {
  type: string;
  value: string;
};

const errorsToFilterOut: ErrorFilter[] = [
  { type: "AxiosError", value: "Network Error" },
];

export const initSentry = () => {
  Sentry.init({
    dsn: config.sentryDSN,
    debug: false,
    enabled: isProd,
    environment: getEnv(),
    beforeSend: (event: ErrorEvent, hint: EventHint) => {
      if (event.exception?.values?.length === 1) {
        const exception = event.exception.values[0];
        const shouldFilter = errorsToFilterOut.some(
          (e) => exception.type === e.type && exception.value === e.value
        );
        if (shouldFilter) {
          return null;
        }
      }
      return event;
    },
  });
};

export function sentryAddBreadcrumb(message: string) {
  const breadcrumbData: Record<string, string> = {
    base64Message: Buffer.from(message).toString("base64"),
  };

  const breadcrumb: Breadcrumb = {
    category: "converse",
    message,
    level: "info",
    data: breadcrumbData,
  };

  Sentry.addBreadcrumb(breadcrumb);
}

export function sentryTrackMessage(
  message: string,
  extras: Record<string, unknown> = {}
) {
  console.log(`[Sentry] ${message}`, extras);
  Sentry.withScope((scope) => {
    scope.setExtras(extras);
    Sentry.captureMessage(message);
  });
}

export function sentryTrackError(
  error: unknown,
  extras: Record<string, unknown> = {}
) {
  Sentry.withScope((scope) => {
    scope.setExtras(extras);
    Sentry.captureException(error);
  });
}
