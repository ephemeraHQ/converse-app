import path from "path";
import { Client } from "@xmtp/react-native-sdk";
import * as RNFS from "react-native-fs";
import { v4 as uuidv4 } from "uuid";
import { captureError } from "@/utils/capture-error";
import logger from "@/utils/logger";

let currentXmtpLoggingPath = "";
let loggingInterval: ReturnType<typeof setInterval> | null = null;

export const isXmtpLoggingActive = () => {
  return loggingInterval !== null;
};

export const startXmtpLogging = async () => {
  // Clear any existing interval
  if (loggingInterval) {
    clearInterval(loggingInterval);
  }

  // Generate new log file path
  const tempDir = RNFS.TemporaryDirectoryPath;
  currentXmtpLoggingPath = path.join(tempDir, `${uuidv4()}.xmtp.log.txt`);

  // Initialize log file with header
  const timestamp = new Date().toISOString();
  await RNFS.writeFile(
    currentXmtpLoggingPath,
    `XMTP Logs Session - Started at ${timestamp}\n\n`,
    "utf8",
  );

  // Start periodic logging
  loggingInterval = setInterval(async () => {
    try {
      const logs = (await Client.exportNativeLogs()) as string;
      await RNFS.writeFile(currentXmtpLoggingPath, logs, "utf8");
      logger.debug("XMTP logs written to", currentXmtpLoggingPath);
    } catch (error) {
      captureError(error);
    }
  }, 5000);
};

export const stopXmtpLogging = () => {
  if (loggingInterval) {
    clearInterval(loggingInterval);
    loggingInterval = null;
  }
};

export const getXmtpLogFile = async () => {
  const logs = (await Client.exportNativeLogs()) as string;
  const logFilePath = path.join(RNFS.TemporaryDirectoryPath, "xmtp.logs.txt");
  await RNFS.writeFile(logFilePath, logs, "utf8");
  return logFilePath;
};

export const getPreviousXmtpLogFile = async () => {
  const tempDir = RNFS.TemporaryDirectoryPath;
  const files = await RNFS.readDir(tempDir);
  const logFiles = files
    .filter((file) => file.name.endsWith(".xmtp.log.txt"))
    .sort((a, b) => (b.mtime?.getTime() ?? 0) - (a.mtime?.getTime() ?? 0));
  return logFiles[1]?.path ?? null;
};

export const XMTP_MAX_MS_UNTIL_LOG_ERROR = 3000; // 3 seconds

export const rotateXmtpLoggingFile = async () => {
  // Stop current logging if active
  stopXmtpLogging();

  // Clear current log file if it exists
  if (currentXmtpLoggingPath && (await RNFS.exists(currentXmtpLoggingPath))) {
    await RNFS.unlink(currentXmtpLoggingPath);
  }

  // Clean up old log files
  const tempDir = RNFS.TemporaryDirectoryPath;
  const files = await RNFS.readDir(tempDir);
  const logFiles = files.filter((file) => file.name.endsWith(".xmtp.log.txt"));

  await Promise.all(
    logFiles.map((file) => RNFS.unlink(path.join(tempDir, file.name))),
  );

  // Restart logging
  await startXmtpLogging();
};
