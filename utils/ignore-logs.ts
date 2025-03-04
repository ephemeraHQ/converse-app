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
]

// Workaround for console filtering in development
if (__DEV__) {
  const connectConsoleTextFromArgs = (args: any[]): string => {
    // Handle case when args is empty
    if (args.length === 0) {
      return ""
    }

    // Handle case when first arg is not a string
    if (typeof args[0] !== "string") {
      return String(args[0])
    }

    // Process string formatting when we have a string as first argument
    return args.slice(1).reduce((baseString, currentArg) => {
      // Convert current arg to string if it's not already
      const currentString = typeof currentArg === "string" ? currentArg : String(currentArg)

      return baseString.replace("%s", currentString)
    }, args[0])
  }

  const filterIgnoredMessages =
    (consoleMethod: typeof console.log) =>
    (...args: any[]) => {
      try {
        const output = connectConsoleTextFromArgs(args)

        if (!IGNORED_LOGS.some((log) => output.includes(log))) {
          consoleMethod(...args)
        }
      } catch (error) {
        // If any error occurs during filtering, fall back to original console method
        consoleMethod(...args)
      }
    }

  console.log = filterIgnoredMessages(console.log)
  console.info = filterIgnoredMessages(console.info)
  console.warn = filterIgnoredMessages(console.warn)
  console.error = filterIgnoredMessages(console.error)
}
