import Constants from "expo-constants";
import path from "path";
import { Platform } from "react-native";
import * as RNFS from "react-native-fs";
import {
  configLoggerType,
  consoleTransport,
  logger as RNLogger,
  transportFunctionType,
} from "react-native-logs";
import { v4 as uuidv4 } from "uuid";

import config from "../config";
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
  if (config.env === "dev") {
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

type logMethodType = (...args: any[]) => void;

const defaultConfig: configLoggerType = {
  severity: process.env.EXPO_PUBLIC_LOGGER_DEFAULT ?? "debug", // TODO: Change severity according to user (debug addresses)
  transport: converseTransport,
  transportOptions: {
    colors: {
      debug: "white",
      info: "blueBright",
      warn: "yellowBright",
      error: "redBright",
    },
  },
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  },
};

const createLogger = (
  config: configLoggerType & {
    prefix?: string;
  } = {}
) => {
  const finalConfig = { ...defaultConfig, ...config };

  const _logger = RNLogger.createLogger({
    severity: finalConfig.severity,
    transport: finalConfig.transport,
    transportOptions: finalConfig.transportOptions,
    levels: finalConfig.levels,
  });

  const loggerWithPrefix = (
    method: logMethodType,
    prefix: string | undefined
  ) => {
    return (...args: any[]) => {
      if (prefix) {
        args[0] = `${prefix} ${args[0]}`;
      }
      method(...args);
    };
  };

  const logger = _logger as typeof _logger & {
    debug: logMethodType;
    info: logMethodType;
    warn: logMethodType;
    error: logMethodType;
  };

  if (finalConfig.prefix) {
    logger.debug = loggerWithPrefix(logger.debug, finalConfig.prefix);
    logger.info = loggerWithPrefix(logger.info, finalConfig.prefix);
    logger.warn = loggerWithPrefix(logger.warn, finalConfig.prefix);
    logger.error = loggerWithPrefix(logger.error, finalConfig.prefix);
  }

  return logger;
};

const logger = createLogger();

const connectWalletLogger = createLogger({
  severity: process.env.EXPO_PUBLIC_LOGGER_CONNECT_WALLET_SEVERITY ?? "debug",
  prefix: "[ConnectWallet]",
});

export { connectWalletLogger, logger };

/** @deprecated use { logger } instead */
export default logger;
