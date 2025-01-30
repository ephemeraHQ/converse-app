import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { Button } from "@/design-system/Button/Button";
import { SettingsList } from "@/design-system/settings-list/settings-list";
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

  const generalSettings = useMemo(
    () => [{ label: "Environment", value: getEnv() }],
    []
  );

  const updateSettings = useMemo(
    () =>
      [
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
      ].filter(Boolean),
    [currentlyRunning, isChecking, isDownloading]
  );

  const newUpdateSettings = useMemo(() => {
    if (!downloadedUpdate) return [];
    return [
      { label: "New Update ID", value: downloadedUpdate.updateId },
      {
        label: "Created",
        value: downloadedUpdate.createdAt.toLocaleString(),
      },
    ];
  }, [downloadedUpdate]);

  return (
    <Screen
      contentContainerStyle={{
        padding: theme.spacing.md,
        rowGap: theme.spacing.xl,
      }}
    >
      <SettingsList rows={generalSettings} />
      <SettingsList rows={updateSettings} />
      {newUpdateSettings.length > 0 && (
        <>
          <SettingsList rows={newUpdateSettings} />
          {isUpdateAvailable && (
            <Button onPress={handleReload}>Reload App to Apply Update</Button>
          )}
        </>
      )}
    </Screen>
  );
});
