import * as Updates from "expo-updates"
import { memo, useMemo, useState } from "react"
import { Button } from "@/design-system/Button/Button"
import { SettingsList } from "@/design-system/settings-list/settings-list"
import { ISettingsListRow } from "@/design-system/settings-list/settings-list.types"
import { Text } from "@/design-system/Text"
import { VStack } from "@/design-system/VStack"
import { useUpdatesLogEntries } from "@/features/app-settings/hooks/use-updates-log-entries"
import { useAppTheme } from "@/theme/use-app-theme"

export const OtaUpdatesList = memo(function OtaUpdatesList() {
  const { theme } = useAppTheme()
  const {
    currentlyRunning,
    isUpdateAvailable,
    downloadedUpdate,
    availableUpdate,
    isChecking,
    isDownloading,
    isUpdatePending,
    checkError,
    downloadError,
    initializationError,
  } = Updates.useUpdates()

  const { data: logEntries = [] } = useUpdatesLogEntries()

  const [checkUpdateError, setCheckUpdateError] = useState<Error | null>(null)
  const [reloadError, setReloadError] = useState<Error | null>(null)

  // Handle reload when update is available
  const handleReload = async () => {
    try {
      setReloadError(null)
      await Updates.reloadAsync()
    } catch (error) {
      setReloadError(error as Error)
    }
  }

  // Add check update function
  const handleCheckUpdate = async () => {
    try {
      setCheckUpdateError(null)
      const update = await Updates.checkForUpdateAsync()

      if (update.isAvailable) {
        await Updates.fetchUpdateAsync()
      }
    } catch (error) {
      setCheckUpdateError(error as Error)
    }
  }

  const otaSettings = useMemo((): ISettingsListRow[] => {
    return [
      {
        label: "Check for OTA updates",
        onPress: handleCheckUpdate,
        loading: isChecking || isDownloading,
        value: isChecking
          ? "Checking for OTA updates..."
          : isDownloading
            ? "Downloading OTA update..."
            : "...",
      },

      // Current Update Info
      {
        label: "Update ID",
        value: currentlyRunning.updateId || "embedded",
      },
      {
        label: "Created At",
        value: currentlyRunning.createdAt?.toLocaleString() || "N/A",
      },
      {
        label: "Runtime Version",
        value: currentlyRunning.runtimeVersion,
      },
      {
        label: "Channel",
        value: currentlyRunning.channel || "N/A",
      },
      {
        label: "Is Embedded",
        value: String(currentlyRunning.isEmbeddedLaunch),
      },

      // Emergency Launch Info
      currentlyRunning.isEmergencyLaunch && [
        { label: "Emergency Launch Info" },
        {
          label: "Emergency Launch",
          value: String(currentlyRunning.isEmergencyLaunch),
        },
        currentlyRunning.emergencyLaunchReason && {
          label: "Emergency Reason",
          value: currentlyRunning.emergencyLaunchReason,
        },
      ],

      // Update Status
      {
        label: "Is Checking",
        value: isChecking ? "Yes" : "No",
      },
      {
        label: "Is Downloading",
        value: isDownloading ? "Yes" : "No",
      },
      {
        label: "Update Available",
        value: isUpdateAvailable ? "Yes" : "No",
      },
      {
        label: "Update Pending",
        value: isUpdatePending ? "Yes" : "No",
      },

      // Available Update Info (before download)
      availableUpdate && [
        {
          label: "Available Update ID",
          value: availableUpdate.updateId,
        },
        {
          label: "Available Update Created At",
          value: availableUpdate.createdAt.toLocaleString(),
        },
      ],

      // Downloaded Update Info
      downloadedUpdate && [
        {
          label: "Downloaded Update ID",
          value: downloadedUpdate.updateId,
        },
        {
          label: "Downloaded Update Created At",
          value: downloadedUpdate.createdAt.toLocaleString(),
        },
      ],

      // Error States
      checkError && [
        {
          label: "Check error message",
          value: checkError.message,
        },
        checkError.stack && {
          label: "Check error stack",
          value: checkError.stack,
        },
      ],

      downloadError && [
        {
          label: "Download error message",
          value: downloadError.message,
        },
        downloadError.stack && {
          label: "Download error stack",
          value: downloadError.stack,
        },
      ],

      initializationError && [
        {
          label: "Initialization error message",
          value: initializationError.message,
        },
        initializationError.stack && {
          label: "Initialization error stack",
          value: initializationError.stack,
        },
      ],

      // Manual Check Errors
      checkUpdateError && [
        {
          label: "Manual check error message",
          value: checkUpdateError.message,
        },
      ],

      reloadError && [
        {
          label: "Reload error message",
          value: reloadError.message,
        },
      ],

      { label: "Update Logs" },
      ...logEntries.map((log) => ({
        label: new Date(log.timestamp).toLocaleString(),
        value: `[${log.level}] ${log.code}: ${log.message}${
          log.stacktrace ? `\n${log.stacktrace.join("\n")}` : ""
        }${log.updateId ? `\nUpdate ID: ${log.updateId}` : ""}${
          log.assetId ? `\nAsset ID: ${log.assetId}` : ""
        }`,
      })),
    ]
      .flat()
      .filter(Boolean)
  }, [
    currentlyRunning,
    isChecking,
    isDownloading,
    isUpdateAvailable,
    isUpdatePending,
    availableUpdate,
    downloadedUpdate,
    checkError,
    downloadError,
    initializationError,
    checkUpdateError,
    reloadError,
    logEntries,
  ])

  return (
    <VStack>
      <Text preset="title">OTA Updates</Text>
      {isUpdateAvailable && (
        <VStack
          style={{
            padding: theme.spacing.md,
            backgroundColor: theme.colors.background.sunken,
            borderRadius: theme.borderRadius.sm,
            rowGap: theme.spacing.sm,
          }}
        >
          <Text preset="formLabel">New Update Available</Text>
          <Text>
            Update ID: {downloadedUpdate?.updateId || availableUpdate?.updateId}
            {(downloadedUpdate?.createdAt || availableUpdate?.createdAt) && (
              <>
                {"\n"}Created:{" "}
                {downloadedUpdate?.createdAt?.toLocaleString() ||
                  availableUpdate?.createdAt?.toLocaleString()}
              </>
            )}
            {"\n"}Status: {downloadedUpdate ? "Downloaded" : "Available"}
          </Text>
          <Button onPress={handleReload} disabled={!downloadedUpdate}>
            {downloadedUpdate ? "Reload App to Apply Update" : "Downloading Update..."}
          </Button>
        </VStack>
      )}

      <SettingsList rows={otaSettings} />
    </VStack>
  )
})
