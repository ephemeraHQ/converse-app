## SpecStory

## Displaying EAS Update Message in App Settings (2/11/2025, 9:21:06 AM)

_**User**_

how can i show the eas update message?

---

_**Assistant**_

I'll help you modify the AppSettingsScreen to show the EAS update message. We'll add it to the info display and improve the update status visibility.

Here's how we can update the file:

```typescript:features/app-settings/app-settings.screen.tsx
// ... existing imports ...
import { VStack } from "@/design-system/VStack";

export const AppSettingsScreen = memo(function AppSettingsScreen() {
  // ... existing code ...

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
      { label: "Status", value: getUpdateStatus() },
      
      // New Update Settings with header (if available)
      ...(downloadedUpdate
        ? [
            { label: "New Update" },
            { label: "New Update ID", value: downloadedUpdate.updateId },
            {
              label: "Created",
              value: downloadedUpdate.createdAt.toLocaleString(),
            },
            {
              label: "Message",
              value: downloadedUpdate.message || "No message provided",
            },
          ]
        : []),
    ].filter(Boolean);
  }, [currentlyRunning, isChecking, isDownloading, downloadedUpdate]);

  // Helper function to get update status
  function getUpdateStatus() {
    if (isChecking) return "Checking for updates...";
    if (isDownloading) return "Downloading update...";
    if (isUpdateAvailable) return "Update available!";
    return "Up to date";
  }

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={{
        paddingHorizontal: theme.spacing.lg,
      }}
    >
      <VStack space="md">
        <HStack
          style={{
            padding: theme.spacing.md,
            backgroundColor: theme.colors.background.sunken,
            borderRadius: theme.borderRadius.sm,
          }}
        >
          <Text preset="formLabel" color="secondary">
            These settings are only available for development and debugging
            purposes
          </Text>
        </HStack>

        <SettingsList rows={allSettings} />

        {isUpdateAvailable && (
          <VStack space="sm">
            {downloadedUpdate?.message && (
              <Text
                preset="body"
                style={{
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.background.sunken,
                  borderRadius: theme.borderRadius.sm,
                }}
              >
                {downloadedUpdate.message}
              </Text>
            )}
            <Button onPress={handleReload}>Reload App to Apply Update</Button>
          </VStack>
        )}
      </VStack>
    </Screen>
  );
});
```

The main changes I made are:

1. Added a `getUpdateStatus` helper function to show the current update status more clearly
2. Added the update message to both the settings list and as a separate highlighted section when an update is available
3. Improved the layout using `VStack` for better spacing and organization
4. Added the update message to the "New Update" section in the settings list
5. Added a more prominent display of the update message above the reload button when an update is available

The update message will now be visible in two places:
1. In the settings list under the "New Update" section
2. As a highlighted message above the reload button when an update is available

This gives users better visibility of the update message while maintaining all the existing debugging information.

---



---

