import * as Sentry from "@sentry/react-native";
import type { ErrorEvent, EventHint } from "@sentry/types";
import { QueryObserver } from "@tanstack/react-query";
import * as Updates from "expo-updates";
import { useEffect } from "react";
import {
  useCurrentSender,
  useMultiInboxStore,
} from "@/features/authentication/multi-inbox.store";
import { getCurrentUserQueryOptions } from "@/features/current-user/curent-user.query";
import { getProfileQueryConfig } from "@/features/profiles/profiles.query";
import { queryClient } from "@/queries/queryClient";
import { getEnv, isDev } from "@/utils/getEnv";
import { config } from "../config";

// Error patterns that should not be reported to Sentry

const errorsToFilterOut = [
  "Request failed with status code 401",
  "Request failed with status code 404",
];

export function sentryInit() {
  Sentry.init({
    dsn: config.sentryDSN,
    debug: false,
    enabled: !isDev,
    environment: getEnv(),

    // For now let's get all traces
    tracesSampleRate: 1.0,

    // Add more context to your events
    attachStacktrace: true,

    // Add experimental features if needed
    _experiments: {
      profilesSampleRate: isDev ? 1.0 : 0.1,
      replaysSessionSampleRate: isDev ? 1.0 : 0.1,
      replaysOnErrorSampleRate: 1.0,
    },

    beforeSend: (event: ErrorEvent, hint: EventHint) => {
      // Filter out specific errors
      if (event.exception?.values?.length === 1) {
        const exception = event.exception.values[0];
        const shouldFilter = errorsToFilterOut.some((errorStr) =>
          exception.value?.includes(errorStr),
        );

        if (shouldFilter) {
          // Drop the event
          return null;
        }
      }

      event.tags = {
        ...event.tags,
        "expo-update-id": Updates.updateId,
        "expo-is-embedded-update": Updates.isEmbeddedLaunch,
      };

      return event;
    },
  });
}

type ISentryTrackErrorArgs = {
  error: Error;
  tags?: Record<string, string>;
  extras?: Record<string, unknown>;
};

export function sentryTrackError({
  error,
  extras,
  tags,
}: ISentryTrackErrorArgs) {
  Sentry.withScope(async (scope) => {
    if (extras) {
      Object.entries(extras).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    if (tags) {
      scope.setTags(tags);
    }

    Sentry.captureException(error);
  });
}

export function sentryIdentifyUser(args: {
  userId?: string;
  username?: string;
}) {
  Sentry.setUser({
    ...(args.userId && { id: args.userId }),
    ...(args.username && { username: args.username }),
  });
}

export function useUpdateSentry() {
  const currentSender = useCurrentSender();

  useEffect(() => {
    if (!currentSender) {
      return;
    }

    // Track user changes
    const userQueryObserver = new QueryObserver(
      queryClient,
      getCurrentUserQueryOptions(),
    );

    const unsubscribeFromUserQueryObserver = userQueryObserver.subscribe(
      (result) => {
        if (result.data) {
          sentryIdentifyUser({
            userId: result.data.id,
          });
        }
      },
    );

    // Track profile changes
    const profileQueryObserver = new QueryObserver(
      queryClient,
      getProfileQueryConfig({
        xmtpId: useMultiInboxStore.getState().currentSender?.inboxId,
      }),
    );

    const unsubscribeFromProfileQueryObserver = profileQueryObserver.subscribe(
      (result) => {
        if (result.data?.name) {
          sentryIdentifyUser({
            username: result.data.name,
          });
        }
      },
    );

    // Watch for inbox changes to update profile query
    const unsubscribeFromStore = useMultiInboxStore.subscribe(
      (state) => state.currentSender?.inboxId,
      (inboxId) => {
        if (inboxId) {
          profileQueryObserver.setOptions(
            getProfileQueryConfig({ xmtpId: inboxId }),
          );
        }
      },
    );

    return () => {
      unsubscribeFromUserQueryObserver();
      unsubscribeFromProfileQueryObserver();
      unsubscribeFromStore();
    };
  }, [currentSender]);
}

// Sentry has ~8KB limit for string values
export const MAX_SENTRY_STRING_SIZE = 8000; // bytes
