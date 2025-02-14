## SpecStory

## Consolidating Settings into One List (1/30/2025, 1:42:58 PM)

_**User**_

put all into 1 SettingsList

---

_**Assistant**_

I'll help you combine all the settings into a single SettingsList component. Here's how to modify the code:

```typescript:features/app-settings/app-settings.screen.tsx
// ... existing code ...

export const AppSettingsScreen = memo(function AppSettingsScreen() {
  // ... existing code ...

  const allSettings = useMemo(
    () => [
      // General Settings with header
      { label: "General", isHeader: true },
      { label: "Environment", value: getEnv() },

      // Update Settings with header
      { label: "Current Update", isHeader: true },
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
            { label: "New Update", isHeader: true },
            { label: "New Update ID", value: downloadedUpdate.updateId },
            {
                label: "Created",
                value: downloadedUpdate.createdAt.toLocaleString(),
            },
          ]
        : []),
    ].filter(Boolean),
    [currentlyRunning, isChecking, isDownloading, downloadedUpdate]
  );

  return (
    <Screen
      contentContainerStyle={{
        padding: theme.spacing.md,
        rowGap: theme.spacing.xl,
      }}
    >
      <SettingsList rows={allSettings} />
      {downloadedUpdate && isUpdateAvailable && (
        <Button onPress={handleReload}>Reload App to Apply Update</Button>
      )}
    </Screen>
  );
});
```

The changes include:
1. Removed the separate `generalSettings`, `updateSettings`, and `newUpdateSettings` useMemo hooks
2. Created a single `allSettings` useMemo that combines all settings with section headers
3. Added `isHeader: true` property to create visual separation between sections
4. Simplified the return JSX by using a single SettingsList
5. Kept the Button component's conditional rendering logic

Note: This assumes your SettingsList component supports header rows with the `isHeader` property. If it doesn't, you'll need to add that support to the SettingsList component.

---



---

