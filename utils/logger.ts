import Constants from "expo-constants"
import { Platform } from "react-native"
import * as RNFS from "react-native-fs"
import { consoleTransport, logger as RNLogger, transportFunctionType } from "react-native-logs"
import { v4 as uuidv4 } from "uuid"

// Types
type LogMethod = (...args: any[]) => void

type ILogger = {
  debug: LogMethod
  info: LogMethod
  warn: LogMethod
  error: LogMethod
}

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const

const COLOR_SCHEMES = {
  dark: {
    debug: "white",
    info: "blueBright",
    warn: "yellowBright",
    error: "redBright",
  },
  light: {
    debug: "black",
    info: "blue",
    warn: "yellow",
    error: "red",
  },
} as const

// Simple file logging
export let loggingFilePath = ""

async function initLogFile() {
  const tempDir = RNFS.TemporaryDirectoryPath
  const separator = Platform.OS === "windows" ? "\\" : "/"
  loggingFilePath = `${tempDir}${tempDir.endsWith(separator) ? "" : separator}${uuidv4()}.convos.log.txt`

  const appVersion = Constants.expoConfig?.version
  const buildNumber =
    Platform.OS === "ios"
      ? Constants.expoConfig?.ios?.buildNumber
      : Constants.expoConfig?.android?.versionCode

  await RNFS.writeFile(
    loggingFilePath,
    `Convos ${Platform.OS} logs - v${appVersion} (${buildNumber})\n\n`,
  )
}

export async function rotateLoggingFile() {
  if (loggingFilePath && (await RNFS.exists(loggingFilePath))) {
    await RNFS.unlink(loggingFilePath)
  }
  await initLogFile()
}

export async function getPreviousSessionLoggingFile() {
  const tempDir = RNFS.TemporaryDirectoryPath
  const files = await RNFS.readDir(tempDir)
  const logFiles = files
    .filter((file) => file.name.endsWith(".convos.log.txt"))
    .sort((a, b) => (b.mtime?.getTime() ?? 0) - (a.mtime?.getTime() ?? 0))

  return logFiles[1]?.path ?? null
}

const convosTransport: transportFunctionType = async (props: {
  msg: string
  rawMsg: unknown
  level: { severity: number; text: string }
}) => {
  let logMessage = props.msg

  // Console logging in dev
  if (__DEV__) {
    consoleTransport(props)
  }

  // File logging with enhanced message
  if (loggingFilePath) {
    await RNFS.appendFile(loggingFilePath, `${logMessage}\n`, "utf8")
  }
}

const activeColorScheme =
  process.env.EXPO_PUBLIC_LOGGER_COLOR_SCHEME === "dark" ? COLOR_SCHEMES.dark : COLOR_SCHEMES.light

const baseLogger = RNLogger.createLogger({
  severity: "debug",
  transport: convosTransport,
  transportOptions: {
    colors: activeColorScheme,
  },
  levels: LOG_LEVELS,
}) as ILogger

function createPrefixedLogger(prefix: string): ILogger {
  return {
    debug: (...args) => baseLogger.debug(`[${prefix}]`, ...args),
    info: (...args) => baseLogger.info(`[${prefix}]`, ...args),
    warn: (...args) => baseLogger.warn(`[${prefix}]`, ...args),
    error: (...args) => baseLogger.error(`[${prefix}]`, ...args),
  }
}

// Initialize log file
initLogFile().catch(console.error)

// Logger exports
export const logger = baseLogger
export const authLogger = createPrefixedLogger("AUTH")
export const streamLogger = createPrefixedLogger("STREAM")
export const apiLogger = createPrefixedLogger("API")
export const xmtpLogger = createPrefixedLogger("XMTP")
export const notificationsLogger = createPrefixedLogger("NOTIFICATIONS")
export const sentryLogger = createPrefixedLogger("SENTRY")
export const persistLogger = createPrefixedLogger("PERSIST")
export const queryLogger = createPrefixedLogger("QUERY")

/**
 * @deprecated Use { logger } instead
 */
export default logger

export function logJson(label: string, json: any) {
  console.log(`${label}:`, JSON.stringify(json, null, 2))
}
