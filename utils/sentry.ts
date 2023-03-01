import * as Sentry from "sentry-expo";

export const sentryTrackMessage = (message: string, extras: any) => {
  Sentry.React.withScope((scope) => {
    scope.setExtras(extras);
    Sentry.React.captureMessage(message);
  });
};
