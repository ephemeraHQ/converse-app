import { getPreviousSessionLoggingFile, loggingFilePath, rotateLoggingFile } from "@utils/logger"
import Share from "@utils/share"
import Constants from "expo-constants"
import { Image } from "expo-image"
import * as Updates from "expo-updates"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { Alert, Platform } from "react-native"
import { config } from "@/config"
import { VStack } from "@/design-system/VStack"
import { useLogout } from "@/features/authentication/use-logout"
import { useStreamingStore } from "@/features/streams/stream-store"
import {
  getPreviousXmtpLogFile,
  getXmtpLogFile,
  isXmtpLoggingActive,
  rotateXmtpLoggingFile,
  startXmtpLogging,
  stopXmtpLogging,
} from "@/features/xmtp/utils/xmtp-logs"
import { translate } from "@/i18n"
import { navigate } from "@/navigation/navigation.utils"
import { $globalStyles } from "@/theme/styles"
import { captureError } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"
import { getEnv } from "@/utils/getEnv"
import { showActionSheet } from "./action-sheet"

export function DebugProvider(props: { children: React.ReactNode }) {
  const { children } = props

  const tapCountRef = useRef(0)
  const tapTimeoutRef = useRef<NodeJS.Timeout>()
  const showDebugMenu = useShowDebugMenu()

  const handleTouchStart = useCallback(() => {
    // Increment tap count
    tapCountRef.current += 1

    // Clear existing timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current)
    }

    // Set new timeout to reset count after 500ms
    tapTimeoutRef.current = setTimeout(() => {
      tapCountRef.current = 0
    }, 300)

    // Show debug menu after 5 taps
    if (tapCountRef.current >= 5) {
      showDebugMenu()
      tapCountRef.current = 0
    }
  }, [showDebugMenu])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current)
      }
    }
  }, [])

  return (
    <VStack onTouchStart={handleTouchStart} style={$globalStyles.flex1}>
      {children}
    </VStack>
  )
}

function useShowDebugMenu() {
  const { logout } = useLogout()

  const { currentlyRunning } = Updates.useUpdates()

  const showLogsMenu = useCallback(() => {
    const logsMethods = {
      "Start new log session": rotateLoggingFile,
      "Share current session logs": async () => {
        Share.open({
          title: translate("debug.converse_log_session"),
          url: `file://${loggingFilePath}`,
          type: "text/plain",
        })
      },
      "Display current session logs": async () => {
        navigate("WebviewPreview", { uri: loggingFilePath })
      },
      "Display previous session logs": async () => {
        const previousLoggingFile = await getPreviousSessionLoggingFile()
        if (!previousLoggingFile) {
          return Alert.alert("No previous session logging file found")
        }
        navigate("WebviewPreview", { uri: previousLoggingFile })
      },
      "Share previous session logs": async () => {
        const previousLoggingFile = await getPreviousSessionLoggingFile()
        if (!previousLoggingFile) {
          return Alert.alert("No previous session logging file found")
        }
        Share.open({
          title: translate("debug.converse_log_session"),
          url: `file://${previousLoggingFile}`,
          type: "text/plain",
        })
      },
      "-": () => Promise.resolve(), // Separator
      [`${isXmtpLoggingActive() ? "Stop" : "Start"} recording XMTP logs`]: async () => {
        if (isXmtpLoggingActive()) {
          stopXmtpLogging()
        } else {
          await startXmtpLogging()
        }
      },
      "Clear XMTP logs": async () => {
        await rotateXmtpLoggingFile()
      },
      "Share current XMTP logs": async () => {
        const logFilePath = await getXmtpLogFile()
        Share.open({
          title: translate("debug.xmtp_log_session"),
          url: `file://${logFilePath}`,
          type: "text/plain",
        })
      },
      "Display current XMTP logs": async () => {
        const logFilePath = await getXmtpLogFile()
        navigate("WebviewPreview", { uri: logFilePath })
      },
      "Share previous XMTP logs": async () => {
        const previousLogFile = await getPreviousXmtpLogFile()
        if (!previousLogFile) {
          return Alert.alert("No previous XMTP logging file found")
        }
        Share.open({
          title: translate("debug.xmtp_log_session"),
          url: `file://${previousLogFile}`,
          type: "text/plain",
        })
      },
      "Display previous XMTP logs": async () => {
        const previousLogFile = await getPreviousXmtpLogFile()
        if (!previousLogFile) {
          return Alert.alert("No previous XMTP logging file found")
        }
        navigate("WebviewPreview", { uri: previousLogFile })
      },
      Cancel: undefined,
    }

    const options = Object.keys(logsMethods)

    showActionSheet({
      options: {
        title: "Debug Logs",
        options,
        cancelButtonIndex: options.indexOf("Cancel"),
      },
      callback: async (selectedIndex?: number) => {
        if (selectedIndex === undefined) {
          return
        }

        const method = logsMethods[options[selectedIndex] as keyof typeof logsMethods]

        if (method) {
          try {
            await method()
          } catch (error) {
            captureError(error)
          }
        }
      },
    })
  }, [])

  const primaryMethods = useMemo(() => {
    return {
      Logout: async () => {
        try {
          await logout({
            caller: "debug_menu",
          })
        } catch (error) {
          alert(error)
        }
      },
      "Clear expo image cache": async () => {
        await Image.clearDiskCache()
        await Image.clearMemoryCache()
        alert("Done!")
      },
      "Show App Info": () => {
        const appVersion = Constants.expoConfig?.version
        const buildNumber =
          Platform.OS === "ios"
            ? Constants.expoConfig?.ios?.buildNumber
            : Constants.expoConfig?.android?.versionCode
        const environment = getEnv()

        Alert.alert(
          "App Information",
          [
            `Version: ${appVersion}`,
            `Build: ${buildNumber}`,
            `Environment: ${environment}`,
            `Update ID: ${currentlyRunning.updateId || "embedded"}`,
            `Created At: ${currentlyRunning.createdAt?.toLocaleString() || "N/A"}`,
            `Runtime Version: ${currentlyRunning.runtimeVersion}`,
            `Channel: ${currentlyRunning.channel || "N/A"}`,
            `Is Embedded: ${currentlyRunning.isEmbeddedLaunch}`,
            `Is Emergency Launch: ${currentlyRunning.isEmergencyLaunch}`,
            `Emergency Launch Reason: ${currentlyRunning.emergencyLaunchReason || "None"}`,
          ]
            .filter(Boolean)
            .join("\n"),
        )
      },
      "Check for OTA updates": async () => {
        try {
          const update = await Updates.checkForUpdateAsync()
          if (update.isAvailable) {
            Alert.alert(
              "Update Available",
              "Would you like to download and install the OTA update?",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Update",
                  onPress: async () => {
                    try {
                      const fetchedUpdate = await Updates.fetchUpdateAsync()
                      if (fetchedUpdate.isNew) {
                        await Updates.reloadAsync()
                      }
                    } catch (error) {
                      captureError(
                        new GenericError({
                          error,
                          additionalMessage: "Failed to fetch OTA update",
                        }),
                      )
                    }
                  },
                },
              ],
            )
          } else {
            Alert.alert("No OTA updates available", "You are running the latest version")
          }
        } catch (error) {
          Alert.alert("Error", JSON.stringify(error))
        }
      },
      "Show Streaming Status": () => {
        const { accountStreamingStates } = useStreamingStore.getState()
        const accounts = Object.keys(accountStreamingStates)

        if (accounts.length === 0) {
          Alert.alert("No Streaming States", "No accounts are currently streaming")
          return
        }

        const statusMessages = accounts.map((account) => {
          const state = accountStreamingStates[account]
          return [
            `Account: ${account}`,
            `Conversations Streaming: ${state.isStreamingConversations ? "ON" : "OFF"}`,
            `Messages Streaming: ${state.isStreamingMessages ? "ON" : "OFF"}`,
            `Consent Streaming: ${state.isStreamingConsent ? "ON" : "OFF"}`,
            "---",
          ].join("\n")
        })

        Alert.alert("Streaming Status", statusMessages.join("\n"))
      },
      "Logs Menu": () => showLogsMenu(),
      Cancel: undefined,
    }
  }, [logout, currentlyRunning, showLogsMenu])

  const showDebugMenu = useCallback(() => {
    const options = Object.keys(primaryMethods)

    showActionSheet({
      options: {
        title: `Converse v${config.appVersion}`,
        options,
        cancelButtonIndex: options.indexOf("Cancel"),
      },
      callback: (selectedIndex?: number) => {
        if (selectedIndex === undefined) return
        const method = primaryMethods[options[selectedIndex] as keyof typeof primaryMethods]
        if (method) {
          method()
        }
      },
    })
  }, [primaryMethods])

  return showDebugMenu
}
