import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { Button } from "@/design-system/Button/Button";
import { HStack } from "@/design-system/HStack";
import { Text } from "@/design-system/Text";
import { SettingsList } from "@/design-system/settings-list/settings-list";
import { ISettingsListRow } from "@/design-system/settings-list/settings-list.types";
import { translate } from "@/i18n";
import { useHeader } from "@/navigation/use-header";
import { useRouter } from "@/navigation/useNavigation";
import { useAppTheme } from "@/theme/useAppTheme";
import { getEnv } from "@/utils/getEnv";
import * as Updates from "expo-updates";
import { memo, useMemo } from "react";

export const AppSettingsScreen = memo(function AppSettingsScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const {
    currentlyRunning,
    isUpdateAvailable,
    downloadedUpdate,
    isDownloading,
    isChecking,
  } = Updates.useUpdates();

  // Handle reload when update is available
  const handleReload = async () => {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      console.error("Failed to reload:", error);
    }
  };

  useHeader({
    safeAreaEdges: ["top"],
    title: translate("app_settings"),
    onBack: () => router.goBack(),
  });

  const allSettings = useMemo((): ISettingsListRow[] => {
    return [
      { label: "Environment", value: getEnv() },
      { label: "Update ID", value: currentlyRunning.updateId || "embedded" },
      {
        label: "Created At",
        value: currentlyRunning.createdAt?.toLocaleString() || "N/A",
      },
      {
        label: "Is Embedded",
        value: String(currentlyRunning.isEmbeddedLaunch),
      },
      { label: "Runtime Version", value: currentlyRunning.runtimeVersion },
      { label: "Channel", value: currentlyRunning.channel || "N/A" },
      {
        label: "Emergency Launch",
        value: String(currentlyRunning.isEmergencyLaunch),
      },
      currentlyRunning.emergencyLaunchReason && {
        label: "Emergency Reason",
        value: currentlyRunning.emergencyLaunchReason,
      },
      currentlyRunning.launchDuration && {
        label: "Launch Duration",
        value: `${currentlyRunning.launchDuration}ms`,
      },
      isChecking && { label: "Status", value: "Checking for updates..." },
      isDownloading && { label: "Status", value: "Downloading update..." },

      // New Update Settings with header (if available)
      ...(downloadedUpdate
        ? [
            { label: "New Update" },
            { label: "New Update ID", value: downloadedUpdate.updateId },
            {
              label: "Created",
              value: downloadedUpdate.createdAt.toLocaleString(),
            },
          ]
        : []),
    ].filter(Boolean);
  }, [currentlyRunning, isChecking, isDownloading, downloadedUpdate]);

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={{
        paddingHorizontal: theme.spacing.lg,
      }}
    >
      <HStack
        style={{
          padding: theme.spacing.md,
          backgroundColor: theme.colors.background.sunken,
          borderRadius: theme.borderRadius.sm,
          marginBottom: theme.spacing.xxxs,
        }}
      >
        <Text preset="formLabel" color="secondary">
          These settings are only available for development and debugging
          purposes
        </Text>
      </HStack>
      <SettingsList rows={allSettings} />
      {downloadedUpdate && isUpdateAvailable && (
        <Button onPress={handleReload}>Reload App to Apply Update</Button>
      )}
    </Screen>
  );
});
