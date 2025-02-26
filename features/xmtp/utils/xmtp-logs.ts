import path from "path";
import { Client } from "@xmtp/react-native-sdk";
import * as RNFS from "react-native-fs";
import { v4 as uuidv4 } from "uuid";
import { captureError } from "@/utils/capture-error";
import logger from "@/utils/logger";

// Constants
const LOG_FILE_EXTENSION = ".xmtp.log.txt";
const LOGGING_INTERVAL_MS = 5000;
const LOG_FILE_ENCODING = "utf8";

type LoggingState = {
  currentLogPath: string;
  interval: ReturnType<typeof setInterval> | null;
};

// State management
const state: LoggingState = {
  currentLogPath: "",
  interval: null,
};

export function isXmtpLoggingActive() {
  return state.interval !== null;
}

export async function startXmtpLogging() {
  // Clear any existing interval
  if (state.interval) {
    clearInterval(state.interval);
  }

  // Generate new log file path
  const tempDir = RNFS.TemporaryDirectoryPath;
  state.currentLogPath = path.join(tempDir, `${uuidv4()}${LOG_FILE_EXTENSION}`);

  // Initialize log file with header
  const timestamp = new Date().toISOString();
  await RNFS.writeFile(
    state.currentLogPath,
    `XMTP Logs Session - Started at ${timestamp}\n\n`,
    LOG_FILE_ENCODING,
  );

  // Start periodic logging
  state.interval = setInterval(async () => {
    try {
      const logs = (await Client.exportNativeLogs()) as string;
      await RNFS.writeFile(state.currentLogPath, logs, LOG_FILE_ENCODING);
      logger.debug("XMTP logs written to", state.currentLogPath);
    } catch (error) {
      captureError(error);
    }
  }, LOGGING_INTERVAL_MS);
}

export function stopXmtpLogging() {
  if (state.interval) {
    clearInterval(state.interval);
    state.interval = null;
  }
}

export async function getXmtpLogFile() {
  const logs = (await Client.exportNativeLogs()) as string;
  const logFilePath = path.join(RNFS.TemporaryDirectoryPath, "xmtp.logs.txt");
  await RNFS.writeFile(logFilePath, logs, LOG_FILE_ENCODING);
  return logFilePath;
}

export function getXmtpLogs() {
  return Client.exportNativeLogs();
}

export async function getPreviousXmtpLogFile() {
  const tempDir = RNFS.TemporaryDirectoryPath;
  const files = await RNFS.readDir(tempDir);
  const logFiles = files
    .filter((file) => file.name.endsWith(LOG_FILE_EXTENSION))
    .sort((a, b) => (b.mtime?.getTime() ?? 0) - (a.mtime?.getTime() ?? 0));

  return logFiles[1]?.path ?? null;
}

export const XMTP_MAX_MS_UNTIL_LOG_ERROR = 3000; // 3 seconds

export async function rotateXmtpLoggingFile() {
  // Stop current logging if active
  stopXmtpLogging();

  // Clear current log file if it exists
  if (state.currentLogPath && (await RNFS.exists(state.currentLogPath))) {
    await RNFS.unlink(state.currentLogPath);
  }

  // Clean up old log files
  const tempDir = RNFS.TemporaryDirectoryPath;
  const files = await RNFS.readDir(tempDir);
  const logFiles = files.filter((file) =>
    file.name.endsWith(LOG_FILE_EXTENSION),
  );

  await Promise.all(
    logFiles.map((file) => RNFS.unlink(path.join(tempDir, file.name))),
  );

  // Restart logging
  await startXmtpLogging();
}
