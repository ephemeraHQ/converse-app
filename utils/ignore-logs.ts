const IGNORED_LOGS = [
  "Couldn't find real values for `KeyboardContext",
  "Error destroying session",
  'event="noNetwork',
  "[Reanimated] Reading from `value` during component render",
  "Attempted to import the module",
  'Attempted to import the module "/Users',
  "Falling back to file-based resolution",
  "sync worker error storage error: Pool needs to  reconnect before use",
  "Require cycle", // This will catch all require cycle warnings
];

// Workaround for console filtering in development
if (__DEV__) {
  const connectConsoleTextFromArgs = (arrayOfStrings: string[]): string =>
    arrayOfStrings
      .slice(1)
      .reduce(
        (baseString, currentString) => baseString.replace("%s", currentString),
        arrayOfStrings[0],
      );

  const filterIgnoredMessages =
    (consoleLog: typeof console.log) =>
    (...args: any[]) => {
      const output = connectConsoleTextFromArgs(args);

      if (!IGNORED_LOGS.some((log) => output.includes(log))) {
        consoleLog(...args);
      }
    };

  console.log = filterIgnoredMessages(console.log);
  console.info = filterIgnoredMessages(console.info);
  console.warn = filterIgnoredMessages(console.warn);
  console.error = filterIgnoredMessages(console.error);
}
