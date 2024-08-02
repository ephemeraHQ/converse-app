import path from "path";
import * as RNFS from "react-native-fs";
import {
  consoleTransport,
  logger as RNLogger,
  transportFunctionType,
} from "react-native-logs";
import { v4 as uuidv4 } from "uuid";

import { sentryAddBreadcrumb, sentryTrackError } from "./sentry";
import config from "../config";

export let loggingFilePath: string;

export const rotateLoggingFile = async () => {
  const tempDir = RNFS.TemporaryDirectoryPath;
  loggingFilePath = path.join(tempDir, `${uuidv4()}.log`);
  await RNFS.writeFile(loggingFilePath, "");
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
  await RNFS.appendFile(loggingFilePath, props.msg, "utf8");
};

const _logger = RNLogger.createLogger({
  severity: "debug", // @todo => change minimum severity according to env & user (debug addresses)
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
});

type logMethodType = (...args: any[]) => void;

const logger = _logger as typeof _logger & {
  debug: logMethodType;
  info: logMethodType;
  warn: logMethodType;
  error: logMethodType;
};

export default logger;
