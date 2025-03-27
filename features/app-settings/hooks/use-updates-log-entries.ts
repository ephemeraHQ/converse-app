import { useQuery } from "@tanstack/react-query"
import * as Updates from "expo-updates"

// Enhanced type based on UpdatesLogEntry from Expo docs
type LogEntry = {
  message: string
  level: Updates.UpdatesLogEntryLevel
  timestamp: number
  code: Updates.UpdatesLogEntryCode
  assetId?: string
  updateId?: string
  stacktrace?: string[]
}

// Query key factory
export const updatesLogEntriesKeys = {
  all: ["updates-log-entries"] as const,
}

async function fetchLogEntries(): Promise<LogEntry[]> {
  try {
    const logs = await Updates.readLogEntriesAsync(3600000)

    // Sort logs by timestamp descending (most recent first)
    return logs.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    throw error
  }
}

export function useUpdatesLogEntries() {
  return useQuery({
    queryKey: updatesLogEntriesKeys.all,
    queryFn: fetchLogEntries,
    // Refresh every minute to get new logs
    refetchInterval: 60 * 1000,
    select: (logs) => {
      // Filter out less important logs for cleaner display
      return logs.filter((log) => {
        // Always show errors and fatal logs
        if (log.level === "error" || log.level === "fatal") return true

        // Show important update-related codes
        const importantCodes = [
          Updates.UpdatesLogEntryCode.UPDATE_FAILED_TO_LOAD,
          Updates.UpdatesLogEntryCode.UPDATE_SERVER_UNREACHABLE,
          Updates.UpdatesLogEntryCode.ASSETS_FAILED_TO_LOAD,
          Updates.UpdatesLogEntryCode.UPDATE_CODE_SIGNING_ERROR,
          Updates.UpdatesLogEntryCode.UPDATE_HAS_INVALID_SIGNATURE,
          Updates.UpdatesLogEntryCode.INITIALIZATION_ERROR,
          Updates.UpdatesLogEntryCode.JS_RUNTIME_ERROR,
        ]

        return importantCodes.includes(log.code)
      })
    },
  })
}
