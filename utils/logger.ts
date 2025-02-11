import Constants from "expo-constants";
import path from "path";
import { Platform } from "react-native";
import * as RNFS from "react-native-fs";
import {
  logger as RNLogger,
  consoleTransport,
  transportFunctionType,
} from "react-native-logs";
import { v4 as uuidv4 } from "uuid";
import { isDev } from "./getEnv";
import { sentryAddBreadcrumb, sentryTrackError } from "./sentry";

export let loggingFilePath: string;

export const getPreviousSessionLoggingFile = async () => {
  const tempDir = RNFS.TemporaryDirectoryPath;
  const files = await RNFS.readDir(tempDir);
  const logFiles = files.filter((file) =>
    file.name.endsWith(".converse.log.txt")
  );

  if (logFiles.length <= 1) {
    return null;
  }

  logFiles.sort((a, b) => {
    const aTime = a.mtime ? a.mtime.getTime() : 0;
    const bTime = b.mtime ? b.mtime.getTime() : 0;
    return bTime - aTime;
  });

  // Return the second most recent file
  return logFiles[1]?.path;
};

export const rotateLoggingFile = async () => {
  if (loggingFilePath && (await RNFS.exists(loggingFilePath))) {
    await RNFS.unlink(loggingFilePath);
  }
  const tempDir = RNFS.TemporaryDirectoryPath;
  loggingFilePath = path.join(tempDir, `${uuidv4()}.converse.log.txt`);
  const appVersion = Constants.expoConfig?.version;
  const buildNumber =
    Platform.OS === "ios"
      ? Constants.expoConfig?.ios?.buildNumber
      : Constants.expoConfig?.android?.versionCode;
  await RNFS.writeFile(
    loggingFilePath,
    `Converse ${Platform.OS} logs - v${appVersion} (${buildNumber})\n\n`
  );
};

const converseTransport: transportFunctionType = async (props) => {
  // Logs are subperformant, so only in dev
  if (isDev) {
    consoleTransport(props);
  }
  if (props.level.severity >= 3) {
    sentryTrackError(props.rawMsg?.[0], props.rawMsg?.[1]);
  } else {
    sentryAddBreadcrumb(props.msg);
  }
  // For now, everyone gets file logging
  if (!loggingFilePath) {
    await rotateLoggingFile();
  }
  await RNFS.appendFile(loggingFilePath, `${props.msg}\n`, "utf8");
};

/**
 * Available console colors for logging with their ANSI codes
 * from: https://github.com/mowispace/react-native-logs?tab=readme-ov-file#available-colors
 */
export const ReactNativeLogColors = {
  black: "black",
  red: "red",
  green: "green",
  yellow: "yellow",
  blue: "blue",
  magenta: "magenta",
  cyan: "cyan",
  white: "white",
  grey: "grey",
  redBright: "redBright",
  greenBright: "greenBright",
  yellowBright: "yellowBright",
  blueBright: "blueBright",
  magentaBright: "magentaBright",
  cyanBright: "cyanBright",
  whiteBright: "whiteBright",
} as const;

type ReactNativeLogColor = keyof typeof ReactNativeLogColors;

const LogLevels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;
type LogLevel = keyof typeof LogLevels;

type ReactNativeLogColorScheme = Record<LogLevel, ReactNativeLogColor>;

const darkSystemColorScheme: ReactNativeLogColorScheme = {
  debug: ReactNativeLogColors.white,
  info: ReactNativeLogColors.blueBright,
  warn: ReactNativeLogColors.yellowBright,
  error: ReactNativeLogColors.redBright,
};

const lightSystemColorScheme: ReactNativeLogColorScheme = {
  debug: ReactNativeLogColors.black,
  info: ReactNativeLogColors.blue,
  warn: ReactNativeLogColors.yellow,
  error: ReactNativeLogColors.red,
};

const activeColorScheme: ReactNativeLogColorScheme =
  // @ts-ignore
  process.env.EXPO_PUBLIC_LOGGER_COLOR_SCHEME === "dark"
    ? darkSystemColorScheme
    : lightSystemColorScheme;

const _logger = RNLogger.createLogger({
  severity: "debug", // @todo => change minimum severity according to env & user (debug addresses)
  transport: converseTransport,
  transportOptions: {
    colors: activeColorScheme,
  },
  levels: LogLevels,
});

type logMethodType = (...args: any[]) => void;

const logger = _logger as typeof _logger & {
  debug: logMethodType;
  info: logMethodType;
  warn: logMethodType;
  error: logMethodType;
};

// Add stream logger
export const streamLogger = {
  ...logger,
  debug: (...args: Parameters<logMethodType>) =>
    logger.debug("[STREAM]", ...args),
  info: (...args: Parameters<logMethodType>) =>
    logger.info("[STREAM]", ...args),
  warn: (...args: Parameters<logMethodType>) =>
    logger.warn("[STREAM]", ...args),
  error: (...args: Parameters<logMethodType>) =>
    logger.error("[STREAM]", ...args),
};

export const authLogger = {
  ...logger,
  debug: (...args: Parameters<logMethodType>) =>
    logger.debug("[AUTH]", ...args),
  info: (...args: Parameters<logMethodType>) => logger.info("[AUTH]", ...args),
  warn: (...args: Parameters<logMethodType>) => logger.warn("[AUTH]", ...args),
  error: (...args: Parameters<logMethodType>) =>
    logger.error("[AUTH]", ...args),
};

/**
 * @deprecated Use { logger } instead
 */
export default logger;

export { logger };
