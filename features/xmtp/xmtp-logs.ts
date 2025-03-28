import { Client } from "@xmtp/react-native-sdk"
import * as RNFS from "react-native-fs"
import { v4 as uuidv4 } from "uuid"
import { captureError } from "@/utils/capture-error"
import { XMTPError } from "@/utils/error"
import { xmtpLogger } from "@/utils/logger"

// Constants
const LOG_FILE_EXTENSION = ".xmtp.log.txt"
const LOGGING_INTERVAL_MS = 5000
const LOG_FILE_ENCODING = "utf8"
const MAX_LOG_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB max log file size
const MAX_LOG_FILES = 5 // Maximum number of log files to keep
const MIN_REQUIRED_STORAGE_BYTES = 50 * 1024 * 1024 // 50MB minimum free space

type LoggingState = {
  currentLogPath: string
  interval: ReturnType<typeof setInterval> | null
}

// State management
const state: LoggingState = {
  currentLogPath: "",
  interval: null,
}

export function isXmtpLoggingActive() {
  return state.interval !== null
}

/**
 * Checks if there's enough free storage space for logging
 */
async function hasEnoughStorageSpace() {
  try {
    const { freeSpace } = await RNFS.getFSInfo()
    return freeSpace > MIN_REQUIRED_STORAGE_BYTES
  } catch (error) {
    captureError(new XMTPError({ error, additionalMessage: "Error checking storage space" }))
    return true // Assume there's enough space if we can't check
  }
}

/**
 * Cleans up old log files, keeping only the most recent ones
 */
async function cleanupOldLogFiles() {
  try {
    const tempDir = RNFS.TemporaryDirectoryPath
    const files = await RNFS.readDir(tempDir)
    const logFiles = files
      .filter((file) => file.name.endsWith(LOG_FILE_EXTENSION))
      .sort((a, b) => (b.mtime?.getTime() ?? 0) - (a.mtime?.getTime() ?? 0))

    // Keep the current log file and MAX_LOG_FILES-1 previous ones
    const filesToDelete = logFiles.slice(MAX_LOG_FILES)

    await Promise.all(filesToDelete.map((file) => RNFS.unlink(file.path)))

    if (filesToDelete.length > 0) {
      xmtpLogger.debug(`Cleaned up ${filesToDelete.length} old XMTP log files`)
    }
  } catch (error) {
    captureError(new XMTPError({ error, additionalMessage: "Error cleaning up old log files" }))
  }
}

/**
 * Checks if the current log file exceeds the size limit
 */
async function shouldRotateLogFile() {
  if (!state.currentLogPath) {
    return false
  }

  try {
    const fileInfo = await RNFS.stat(state.currentLogPath)
    return fileInfo.size > MAX_LOG_FILE_SIZE_BYTES
  } catch (error) {
    captureError(new XMTPError({ error, additionalMessage: "Error checking log file size" }))
    return false
  }
}

export async function startXmtpLogging() {
  // Don't start if already running
  if (state.interval) {
    return
  }

  // Check for available storage space
  if (!(await hasEnoughStorageSpace())) {
    xmtpLogger.warn("Not enough storage space available for XMTP logging")
    return
  }

  // Clean up old log files before starting
  await cleanupOldLogFiles()

  // Generate new log file path
  const tempDir = RNFS.TemporaryDirectoryPath
  state.currentLogPath = `${tempDir}${uuidv4()}${LOG_FILE_EXTENSION}`

  // Initialize log file with header
  const timestamp = new Date().toISOString()
  await RNFS.writeFile(
    state.currentLogPath,
    `XMTP Logs Session - Started at ${timestamp}\n\n`,
    LOG_FILE_ENCODING,
  )

  // Start periodic logging
  state.interval = setInterval(async () => {
    try {
      // Check if we need to rotate the log file due to size
      if (await shouldRotateLogFile()) {
        await rotateXmtpLoggingFile()
        return
      }

      // Check if we still have enough storage space
      if (!(await hasEnoughStorageSpace())) {
        xmtpLogger.warn("Low storage space detected, stopping XMTP logging")
        stopXmtpLogging()
        return
      }

      const logs = (await Client.exportNativeLogs()) as string
      await RNFS.writeFile(state.currentLogPath, logs, LOG_FILE_ENCODING)
      xmtpLogger.debug("XMTP logs written to", state.currentLogPath)
    } catch (error) {
      captureError(new XMTPError({ error, additionalMessage: "Error writing XMTP logs" }))
    }
  }, LOGGING_INTERVAL_MS)
}

export function stopXmtpLogging() {
  if (state.interval) {
    clearInterval(state.interval)
    state.interval = null
    xmtpLogger.debug("XMTP logging stopped")
  }
}

export async function getXmtpLogFile() {
  const logs = (await Client.exportNativeLogs()) as string
  const logFilePath = `${RNFS.TemporaryDirectoryPath}xmtp.logs.txt`
  await RNFS.writeFile(logFilePath, logs, LOG_FILE_ENCODING)
  return logFilePath
}

export function getXmtpLogs() {
  return Client.exportNativeLogs()
}

export async function getPreviousXmtpLogFile() {
  const tempDir = RNFS.TemporaryDirectoryPath
  const files = await RNFS.readDir(tempDir)
  const logFiles = files
    .filter((file) => file.name.endsWith(LOG_FILE_EXTENSION))
    .sort((a, b) => (b.mtime?.getTime() ?? 0) - (a.mtime?.getTime() ?? 0))

  return logFiles[1]?.path ?? null
}

export const XMTP_MAX_MS_UNTIL_LOG_ERROR = 3000 // 3 seconds

export async function rotateXmtpLoggingFile() {
  // Stop current logging if active
  const wasActive = isXmtpLoggingActive()
  stopXmtpLogging()

  // Clean up old log files
  await cleanupOldLogFiles()

  // Only restart if it was active before
  if (wasActive) {
    await startXmtpLogging()
  }
}
