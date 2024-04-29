export const initSentry = () => {};

export const sentryAddBreadcrumb = (message: string, forceSafe = false) => {};

export const sentryTrackMessage = (message: string, extras = {} as any) => {
  console.log(`[Sentry] ${message}`, extras);
};

export const sentryTrackError = (error: any, extras = {} as any) => {
  console.error(error, extras);
};
