import * as Sentry from "sentry-expo";

export const sentryTrackMessage = (message: string, extras = {} as any) => {
  console.log(`[Sentry] ${message}`, extras);
  Sentry.React.withScope((scope) => {
    scope.setExtras(extras);
    Sentry.React.captureMessage(message);
  });
};

export const sentryTrackError = (error: any, extras = {} as any) => {
  console.error(error, extras);
  Sentry.React.withScope((scope) => {
    scope.setExtras(extras);
    Sentry.React.captureException(error);
  });
};
