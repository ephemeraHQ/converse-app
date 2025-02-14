## SpecStory

## Refactoring AppSettingsScreen for Better UI (1/30/2025, 1:39:44 PM)

_**User**_

can you use  @settings-list.tsx @settings-list-row.tsx  instead to make it more beautiful

---

_**Assistant**_

I'll help you refactor the AppSettingsScreen to use the SettingsList component for a more consistent and beautiful UI. Here's how we can modify the file:

```typescript:features/app-settings/app-settings.screen.tsx
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

  const generalSettings = useMemo(() => [
    { label: "Environment", value: getEnv() },
  ], []);

  const updateSettings = useMemo(() => [
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
  ].filter(Boolean), [currentlyRunning, isChecking, isDownloading]);

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
```

Key changes made:
1. Removed the custom Section and DebugText components in favor of SettingsList
2. Organized settings into logical groups using useMemo
3. Simplified the layout structure
4. Maintained all the same information but presented in a more consistent and polished way
5. Used filter(Boolean) to remove any conditional items that evaluate to undefined
6. Kept the reload button functionality for when updates are available

The new version provides a more consistent look and feel with the rest of the app while maintaining all the functionality of the original screen.

---



---

