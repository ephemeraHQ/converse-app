import * as Sentry from "@sentry/react-native";
import type { EventHint, ErrorEvent } from "@sentry/types";

import config from "../config";

export const initSentry = () => {
  Sentry.init({
    dsn: config.sentryDSN,
    debug: false,
    enabled: config.env !== "dev",
    environment: config.env,
    beforeSend: (event: ErrorEvent, hint: EventHint) => {
      // Filtering out some errors
      const errorsToFilterOut = [
        { type: "AxiosError", value: "Network Error" },
      ];
      if (event.exception?.values?.length === 1) {
        const exception = event.exception?.values[0];
        if (
          errorsToFilterOut.some(
            (e) => exception.type === e.type && exception.value === e.value
          )
        ) {
          return null;
        }
      }

      return event;
    },
  });
};

export const sentryAddBreadcrumb = (message: string, forceSafe = false) => {
  const data = {
    base64Message: Buffer.from(message).toString("base64"),
  } as any;
  if (forceSafe) {
    data.safeValue = message;
  }
  Sentry.addBreadcrumb({
    category: "converse",
    message,
    level: "info",
    data,
  });
};

export const sentryTrackMessage = (message: string, extras = {} as any) => {
  console.log(`[Sentry] ${message}`, extras);
  Sentry.withScope((scope) => {
    scope.setExtras(extras);
    Sentry.captureMessage(message);
  });
};

export const sentryTrackError = (error: any, extras = {} as any) => {
  console.error(error, extras);
  Sentry.withScope((scope) => {
    scope.setExtras(extras);
    Sentry.captureException(error);
  });
};
