## SpecStory

## Implementing Update Message Logs in App Settings (2/11/2025, 9:25:09 AM)

_**User**_

read @https://docs.expo.dev/versions/latest/sdk/updates/#hooks  i want to show the update message log

---

_**Assistant**_

I'll help you add the update message log to the app settings screen using the `readLogEntriesAsync` method from expo-updates. Here's how we can modify the screen:

```typescript:features/app-settings/app-settings.screen.tsx
import { getPackageVersion } from "@/@/utils/get-package-version";
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
import { memo, useEffect, useMemo, useState } from "react";

// Add type for log entries
type LogEntry = {
  message: string;
  level: string;
  timestamp: number;
};

export const AppSettingsScreen = memo(function AppSettingsScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  
  const {
    currentlyRunning,
    isUpdateAvailable,
    downloadedUpdate,
    isDownloading,
    isChecking,
  } = Updates.useUpdates();

  // Fetch log entries on mount
  useEffect(() => {
    async function fetchLogs() {
      try {
        // Get logs from last hour (3600000 ms)
        const logs = await Updates.readLogEntriesAsync(3600000);
        setLogEntries(logs);
      } catch (error) {
        console.error("Failed to fetch update logs:", error);
      }
    }
    fetchLogs();
  }, []);

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
      // ... existing settings ...
      { label: "Environment", value: getEnv() },
      {
        label: "XMTP RN SDK Version",
        value: getPackageVersion("@xmtp/react-native-sdk"),
      },
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

      // Add Update Logs section
      { label: "Update Logs" },
      ...logEntries.map((log) => ({
        label: new Date(log.timestamp).toLocaleString(),
        value: `[${log.level}] ${log.message}`,
        valueStyle: { fontSize: theme.typography.sizes.xs },
      })),

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
  }, [currentlyRunning, isChecking, isDownloading, downloadedUpdate, logEntries, theme.typography.sizes.xs]);

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
```

The main changes I made are:

1. Added a `LogEntry` type to define the structure of log entries
2. Added a `logEntries` state to store the update logs
3. Added a `useEffect` hook to fetch logs when the component mounts
4. Added a new "Update Logs" section to the settings list that displays:
   - Timestamp of each log entry
   - Log level and message
   - Formatted with a smaller font size for better readability

The logs will show important information about the update process, including:
- When updates were checked
- When updates were downloaded
- Any errors that occurred during the update process
- Runtime errors
- Asset loading status
- And other relevant update-related events

The logs are fetched from the last hour by default (3600000 milliseconds), but you can adjust this timeframe by changing the argument passed to `readLogEntriesAsync()`.

---

_**User**_

use useQuery to get the entry logs . create a hook like useUpdatesLogEntries

---

_**Assistant**_

I'll help you create a custom hook for fetching update logs using React Query. First, let's create the hook and then update the screen to use it.

```typescript:features/app-settings/hooks/use-updates-log-entries.ts
import * as Updates from "expo-updates";
import { useQuery } from "@tanstack/react-query";

type LogEntry = {
  message: string;
  level: string;
  timestamp: number;
};

// Query key factory
export const updatesLogEntriesKeys = {
  all: ["updates-log-entries"] as const,
};

async function fetchLogEntries(): Promise<LogEntry[]> {
  try {
    // Get logs from last hour (3600000 ms)
    return await Updates.readLogEntriesAsync(3600000);
  } catch (error) {
    throw error;
  }
}

export function useUpdatesLogEntries() {
  return useQuery({
    queryKey: updatesLogEntriesKeys.all,
    queryFn: fetchLogEntries,
    // Refresh every minute to get new logs
    refetchInterval: 60 * 1000,
  });
}
```

Now let's update the screen to use this hook:

```typescript:features/app-settings/app-settings.screen.tsx
import { getPackageVersion } from "@/@/utils/get-package-version";
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
import { useUpdatesLogEntries } from "./hooks/use-updates-log-entries";

export const AppSettingsScreen = memo(function AppSettingsScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { data: logEntries = [] } = useUpdatesLogEntries();
  
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
      // ... existing settings ...
      { label: "Environment", value: getEnv() },
      {
        label: "XMTP RN SDK Version",
        value: getPackageVersion("@xmtp/react-native-sdk"),
      },
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

      // Add Update Logs section
      { label: "Update Logs" },
      ...logEntries.map((log) => ({
        label: new Date(log.timestamp).toLocaleString(),
        value: `[${log.level}] ${log.message}`,
        valueStyle: { fontSize: theme.typography.sizes.xs },
      })),

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
  }, [currentlyRunning, isChecking, isDownloading, downloadedUpdate, logEntries, theme.typography.sizes.xs]);

  // ... rest of the component remains the same ...
});
```

The main changes are:

1. Created a new custom hook `useUpdatesLogEntries` that:
   - Uses React Query to manage the data fetching
   - Automatically refreshes the logs every minute
   - Handles error states properly
   - Provides type safety for the log entries

2. Updated the screen component to:
   - Remove the local state and useEffect
   - Use the new hook with destructured data
   - Keep the same UI rendering logic but with cleaner data management

This approach provides several benefits:
- Automatic caching and revalidation
- Better error handling
- Consistent data fetching pattern
- Automatic background updates
- Reduced component complexity

The logs will still be displayed in the same way, but the data management is now handled more efficiently through React Query.

---

_**User**_

anything here you think is worth adding to help debugging? @https://docs.expo.dev/versions/latest/sdk/updates/ 

---

_**Assistant**_

Yes, looking at the documentation, we can enhance the log entries with more useful debugging information. Let's update the `use-updates-log-entries.ts` hook to include additional fields from the `UpdatesLogEntry` type and add some helpful filtering:

```typescript:features/app-settings/hooks/use-updates-log-entries.ts
import * as Updates from "expo-updates";
import { useQuery } from "@tanstack/react-query";

// Enhanced type based on UpdatesLogEntry from Expo docs
type LogEntry = {
  message: string;
  level: Updates.UpdatesLogEntryLevel;
  timestamp: number;
  code: Updates.UpdatesLogEntryCode;
  assetId?: string;
  updateId?: string;
  stacktrace?: string[];
};

// Query key factory
export const updatesLogEntriesKeys = {
  all: ["updates-log-entries"] as const,
};

async function fetchLogEntries(): Promise<LogEntry[]> {
  try {
    const logs = await Updates.readLogEntriesAsync(3600000);
    
    // Sort logs by timestamp descending (most recent first)
    return logs.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    throw error;
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
        if (log.level === "error" || log.level === "fatal") return true;
        
        // Show important update-related codes
        const importantCodes = [
          Updates.UpdatesLogEntryCode.UPDATE_FAILED_TO_LOAD,
          Updates.UpdatesLogEntryCode.UPDATE_SERVER_UNREACHABLE,
          Updates.UpdatesLogEntryCode.ASSETS_FAILED_TO_LOAD,
          Updates.UpdatesLogEntryCode.UPDATE_CODE_SIGNING_ERROR,
          Updates.UpdatesLogEntryCode.UPDATE_HAS_INVALID_SIGNATURE,
          Updates.UpdatesLogEntryCode.INITIALIZATION_ERROR,
          Updates.UpdatesLogEntryCode.JS_RUNTIME_ERROR,
        ];
        
        return importantCodes.includes(log.code);
      });
    },
  });
}
```

And let's update how we display the logs in the settings screen:

```typescript:features/app-settings/app-settings.screen.tsx
// ... existing imports ...

      // Add Update Logs section
      { label: "Update Logs" },
      ...logEntries.map((log) => ({
        label: new Date(log.timestamp).toLocaleString(),
        value: `[${log.level}] ${log.code}: ${log.message}${
          log.stacktrace ? `\n${log.stacktrace.join("\n")}` : ""
        }${log.updateId ? `\nUpdate ID: ${log.updateId}` : ""}${
          log.assetId ? `\nAsset ID: ${log.assetId}` : ""
        }`,
        valueStyle: { 
          fontSize: theme.typography.sizes.xs,
          color: log.level === "error" || log.level === "fatal" 
            ? theme.colors.text.error 
            : theme.colors.text.secondary
        },
      })),
```

These changes add several improvements:

1. Enhanced the `LogEntry` type to include all relevant fields from the Expo docs
2. Added sorting to show most recent logs first
3. Added filtering to only show important logs:
   - All error and fatal level logs
   - Logs with important update-related codes
4. Improved log display:
   - Shows the log code for better context
   - Includes stacktrace when available
   - Shows update ID and asset ID when available
   - Color codes error and fatal logs in red
   - Maintains smaller font size for readability

This will make debugging update issues much easier by:
- Focusing on important logs
- Providing more context for each log entry
- Making errors more visible
- Including stack traces for better error tracking

---

_**User**_

anything else? doens'T need to be related to log entries

---

_**Assistant**_

Yes, looking at the Expo Updates documentation, we can add a few more useful debugging features to the settings screen:

```typescript:features/app-settings/app-settings.screen.tsx
import { getPackageVersion } from "@/@/utils/get-package-version";
// ... other imports
import { Platform } from "react-native";

export const AppSettingsScreen = memo(function AppSettingsScreen() {
  // ... existing code ...

  // Add check update function
  const handleCheckUpdate = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
    }
  };

  const allSettings = useMemo((): ISettingsListRow[] => {
    return [
      // ... existing settings ...

      // Add platform-specific update settings
      { label: "Platform Settings" },
      { 
        label: "Platform", 
        value: Platform.OS === "ios" ? "iOS" : "Android" 
      },
      { 
        label: "Update Mechanism", 
        value: Updates.isEmbeddedLaunch ? "Embedded" : "Update" 
      },
      {
        label: "Update URL",
        value: Updates.manifestString 
          ? JSON.parse(Updates.manifestString).updateUrl 
          : "N/A"
      },
      {
        label: "Release Channel",
        value: Updates.releaseChannel || "default"
      },
      {
        label: "SDK Version",
        value: Updates.sdkVersion || "N/A"
      },
      {
        label: "Runtime Version",
        value: Updates.runtimeVersion || "N/A"
      },

      // ... rest of the settings
    ].filter(Boolean);
  }, [/* ... existing deps ... */]);

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
      
      {/* Add action buttons */}
      <HStack spacing="md" style={{ marginTop: theme.spacing.md }}>
        <Button 
          onPress={handleCheckUpdate}
          style={{ flex: 1 }}
        >
          Check for Updates
        </Button>
        {downloadedUpdate && isUpdateAvailable && (
          <Button 
            onPress={handleReload}
            style={{ flex: 1 }}
          >
            Apply Update
          </Button>
        )}
      </HStack>
    </Screen>
  );
});
```

The changes add:

1. Platform-specific information:
   - Platform (iOS/Android)
   - Update mechanism (Embedded vs Update)
   - Update URL from manifest
   - Release channel
   - SDK version
   - Runtime version

2. Manual update checking:
   - Added a "Check for Updates" button
   - Improved button layout with HStack
   - Both buttons side by side when update is available

3. Better update control:
   - Manual update checking capability
   - Clearer button labels
   - Better visual organization of update actions

These additions will help with:
- Understanding which update mechanism is being used
- Debugging platform-specific issues
- Manually triggering update checks
- Seeing more details about the current update configuration

---

_**User**_

I'm having a problem where in my app i don't see the latest updates. But it's weird because i push update on the same environemtn and same channel and same runtime version ,but still in the app it shows update that are not the newest one?? am i missing anything here?? 

---

_**Assistant**_

Based on your description, there are a few things we can add to help debug update issues. Let's enhance the settings screen to show more relevant information about updates and add some debugging helpers:

```typescript:features/app-settings/app-settings.screen.tsx
import { getPackageVersion } from "@/@/utils/get-package-version";
// ... other imports
import { logger } from "@/utils/logger";

export const AppSettingsScreen = memo(function AppSettingsScreen() {
  // ... existing code ...

  // Add manual check for updates
  const handleCheckUpdate = async () => {
    try {
      logger.debug("[AppSettings] Manually checking for updates...");
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        logger.debug(`[AppSettings] Update available, fetching...`);
        await Updates.fetchUpdateAsync();
      } else {
        logger.debug("[AppSettings] No updates available");
      }
    } catch (error) {
      logger.error("[AppSettings] Failed to check/fetch updates:", error);
    }
  };

  const allSettings = useMemo((): ISettingsListRow[] => {
    return [
      // ... existing settings ...
      { label: "Update Configuration" },
      { 
        label: "Release Channel",
        value: Updates.releaseChannel || "default"
      },
      {
        label: "Runtime Version",
        value: currentlyRunning.runtimeVersion
      },
      {
        label: "Update URL",
        value: Updates.manifestString 
          ? JSON.parse(Updates.manifestString).updateUrl 
          : "N/A"
      },
      {
        label: "Update Status",
        value: isUpdateAvailable 
          ? "Available" 
          : "Up to date"
      },
      {
        label: "Current Update ID",
        value: currentlyRunning.updateId || "embedded"
      },
      currentlyRunning.createdAt && {
        label: "Current Update Created",
        value: currentlyRunning.createdAt.toLocaleString()
      },
      downloadedUpdate && [
        { label: "New Update Available" },
        { 
          label: "New Update ID",
          value: downloadedUpdate.updateId
        },
        {
          label: "New Update Created",
          value: downloadedUpdate.createdAt.toLocaleString()
        }
      ],
      // ... rest of settings
    ].flat().filter(Boolean);
  }, [currentlyRunning, isUpdateAvailable, downloadedUpdate]);

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={{
        paddingHorizontal: theme.spacing.lg,
      }}
    >
      {isUpdateAvailable && (
        <VStack
          style={{
            paddingVertical: theme.spacing.md,
            rowGap: theme.spacing.sm,
          }}
        >
          <Button onPress={handleReload}>Reload App to Apply Update</Button>
          <Text>
            New update available: {downloadedUpdate?.updateId} created at{" "}
            {downloadedUpdate?.createdAt.toLocaleString()}
          </Text>
        </VStack>
      )}

      <VStack
        style={{
          padding: theme.spacing.md,
          backgroundColor: theme.colors.background.sunken,
          borderRadius: theme.borderRadius.sm,
          marginBottom: theme.spacing.md,
          rowGap: theme.spacing.sm,
        }}
      >
        <Text preset="formLabel" color="secondary">
          These settings are only available for development and debugging purposes
        </Text>
        <Button onPress={handleCheckUpdate} preset="secondary">
          Check for Updates Manually
        </Button>
      </VStack>

      <SettingsList rows={allSettings} />
    </Screen>
  );
});
```

Common issues that could cause update problems:

1. **Runtime Version Mismatch**: Make sure the `runtimeVersion` in your `app.config.ts` matches between builds. If they don't match, Expo won't serve the update.

2. **Channel Issues**: Verify you're publishing to the correct channel and the app is configured to use that channel.

3. **Cache Issues**: Sometimes the update cache needs to be cleared. You can add a clear cache function:

```typescript:features/app-settings/app-settings.screen.tsx
const handleClearCache = async () => {
  try {
    logger.debug("[AppSettings] Clearing updates cache...");
    await Updates.clearUpdateCacheAsync();
    // Force check for updates after clearing cache
    await handleCheckUpdate();
  } catch (error) {
    logger.error("[AppSettings] Failed to clear cache:", error);
  }
};

// Add this button in the VStack with other buttons:
<Button onPress={handleClearCache} preset="secondary">
  Clear Updates Cache
</Button>
```

4. **Manifest Issues**: Check your app.config.ts to ensure it's configured correctly:

```typescript:app.config.ts
export default {
  // ...
  updates: {
    enabled: true,
    checkAutomatically: "ON_LOAD",
    fallbackToCacheTimeout: 0,
    url: "your-update-url",
  },
  runtimeVersion: {
    policy: "sdkVersion" // or use a specific version string
  },
  // ...
};
```

The enhanced settings screen will help you:
- See exactly which update is running
- Compare current vs available update details
- Manually trigger update checks
- Clear the update cache if needed
- View the update URL and channel being used

This should help identify why newer updates aren't being picked up. Common causes are:
- Mismatched runtime versions
- Wrong channel
- Cached updates
- Update not properly published
- Network/server issues reaching the update URL

---

_**User**_

how do we make sure to check for new updates? I thought that Updates.useUpdates() was automaitcally checking for new updates?

---

_**Assistant**_

According to the Expo documentation, `Updates.useUpdates()` doesn't automatically check for updates - it just provides the update state. The automatic checking is controlled by the `checkAutomatically` setting in your app.config.ts, which you have set to `"ON_LOAD"`.

Let's add a hook to handle update checking. Here's how we can improve it:

```typescript:features/app-settings/hooks/use-updates-check.ts
import * as Updates from "expo-updates";
import { useEffect, useState } from "react";
import { logger } from "@/utils/logger";
import { AppState } from "react-native";

export function useUpdatesCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const { isUpdateAvailable, currentlyRunning } = Updates.useUpdates();

  const checkForUpdate = async () => {
    try {
      setIsChecking(true);
      logger.debug(`[Updates] Checking for updates... Current update ID: ${currentlyRunning.updateId}`);
      
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        logger.debug("[Updates] Update available, downloading...");
        await Updates.fetchUpdateAsync();
      } else {
        logger.debug("[Updates] No updates available");
      }
    } catch (error) {
      logger.error("[Updates] Error checking for updates:", error);
    } finally {
      setIsChecking(false);
    }
  };

  // Check for updates when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkForUpdate();
      }
    });

    // Initial check
    checkForUpdate();

    return () => {
      subscription.remove();
    };
  }, []);

  return {
    isChecking,
    isUpdateAvailable,
    checkForUpdate,
  };
}
```

Then update the settings screen to use this hook:

```typescript:features/app-settings/app-settings.screen.tsx
import { getPackageVersion } from "@/@/utils/get-package-version";
// ... other imports
import { useUpdatesCheck } from "./hooks/use-updates-check";

export const AppSettingsScreen = memo(function AppSettingsScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { data: logEntries = [] } = useUpdatesLogEntries();
  const { isChecking, isUpdateAvailable, checkForUpdate } = useUpdatesCheck();
  
  const { currentlyRunning, downloadedUpdate } = Updates.useUpdates();

  // ... rest of the code ...

  const allSettings = useMemo((): ISettingsListRow[] => {
    return [
      // ... existing settings ...
      { label: "Update Status" },
      {
        label: "Checking for Updates",
        value: isChecking ? "Yes" : "No"
      },
      {
        label: "Update Available",
        value: isUpdateAvailable ? "Yes" : "No"
      },
      // ... rest of settings
    ].filter(Boolean);
  }, [currentlyRunning, logEntries, isChecking, isUpdateAvailable]);

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={{
        paddingHorizontal: theme.spacing.lg,
      }}
    >
      {isUpdateAvailable && (
        <VStack
          style={{
            paddingVertical: theme.spacing.md,
            rowGap: theme.spacing.sm,
          }}
        >
          <Button onPress={handleReload}>Reload App to Apply Update</Button>
          <Text>
            New update available: {downloadedUpdate?.updateId} created at{" "}
            {downloadedUpdate?.createdAt.toLocaleString()}
          </Text>
        </VStack>
      )}

      <VStack
        style={{
          padding: theme.spacing.md,
          backgroundColor: theme.colors.background.sunken,
          borderRadius: theme.borderRadius.sm,
          marginBottom: theme.spacing.md,
          rowGap: theme.spacing.sm,
        }}
      >
        <Text preset="formLabel" color="secondary">
          These settings are only available for development and debugging purposes
        </Text>
        <Button 
          onPress={checkForUpdate} 
          preset="secondary"
          loading={isChecking}
        >
          Check for Updates
        </Button>
      </VStack>

      <SettingsList rows={allSettings} />
    </Screen>
  );
});
```

This implementation:

1. Automatically checks for updates when:
   - The app first loads (via `checkAutomatically: "ON_LOAD"` in app.config.ts)
   - The app comes to the foreground (via AppState listener)
   - User manually triggers a check

2. Shows the current update status:
   - Whether it's currently checking
   - Whether an update is available
   - Current update ID and timestamp
   - New update ID and timestamp when available

3. Provides manual update checking with loading state

4. Logs all update-related actions for debugging

Make sure your app.config.ts has the correct update URL:

```typescript:app.config.ts
updates: {
  enabled: true,
  checkAutomatically: "ON_LOAD",
  fallbackToCacheTimeout: 0,
  url: "https://u.expo.dev/your-project-id", // Make sure this is correct
},
```

This should give you more control and visibility over the update checking process.

---

_**User**_

there are all those other properties from Updates.useUpdates, make sure to render them in the list, espacially errors

---

_**Assistant**_

I'll help you add all the relevant properties from `Updates.useUpdates()` to the settings list, with special attention to error states:

```typescript:features/app-settings/app-settings.screen.tsx
export const AppSettingsScreen = memo(function AppSettingsScreen() {
  // ... other code ...

  const { 
    currentlyRunning, 
    isUpdateAvailable, 
    downloadedUpdate,
    isChecking,
    isDownloading,
    isUpdatePending,
    checkError,
    downloadError,
    initializationError,
    lastCheckForUpdateTimeNative,
  } = Updates.useUpdates();

  const allSettings = useMemo((): ISettingsListRow[] => {
    return [
      // ... existing settings ...

      // Update Status
      { label: "Update Status" },
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
      lastCheckForUpdateTimeNative && {
        label: "Last Check Time",
        value: new Date(lastCheckForUpdateTimeNative).toLocaleString(),
      },

      // Error States
      checkError && [
        { label: "Check Error" },
        { 
          label: "Message", 
          value: checkError.message,
          valueStyle: { color: theme.colors.text.error }
        },
        checkError.stack && {
          label: "Stack",
          value: checkError.stack,
          valueStyle: { color: theme.colors.text.error }
        }
      ],
      
      downloadError && [
        { label: "Download Error" },
        { 
          label: "Message", 
          value: downloadError.message,
          valueStyle: { color: theme.colors.text.error }
        },
        downloadError.stack && {
          label: "Stack",
          value: downloadError.stack,
          valueStyle: { color: theme.colors.text.error }
        }
      ],
      
      initializationError && [
        { label: "Initialization Error" },
        { 
          label: "Message", 
          value: initializationError.message,
          valueStyle: { color: theme.colors.text.error }
        },
        initializationError.stack && {
          label: "Stack",
          value: initializationError.stack,
          valueStyle: { color: theme.colors.text.error }
        }
      ],

      // ... rest of your settings
    ].flat().filter(Boolean);
  }, [
    currentlyRunning,
    logEntries,
    isChecking,
    isDownloading,
    isUpdateAvailable,
    isUpdatePending,
    checkError,
    downloadError,
    initializationError,
    lastCheckForUpdateTimeNative,
    theme.colors.text.error,
  ]);

  // ... rest of the component
```

Key changes:
1. Added all status flags from `useUpdates()`
2. Added error states with full stack traces
3. Added last check time
4. Used `flat()` to handle nested arrays from error sections
5. Added error styling to make errors more visible
6. Updated dependencies array to include all used values

This will give you complete visibility into the update process and any errors that might occur. The error sections will only appear when there are actual errors, and they'll be clearly visible in red.

---

_**User**_

create a new component that will be a new SettgsList for the OTA update stuff

---

_**Assistant**_

I'll help you create a new component for the OTA (Over The Air) update settings list.

```typescript:features/app-settings/components/ota-updates-list.tsx
import { SettingsList } from "@/design-system/settings-list/settings-list";
import { ISettingsListRow } from "@/design-system/settings-list/settings-list.types";
import { useAppTheme } from "@/theme/useAppTheme";
import * as Updates from "expo-updates";
import { memo, useMemo } from "react";

export const OtaUpdatesList = memo(function OtaUpdatesList() {
  const { theme } = useAppTheme();
  const { 
    currentlyRunning, 
    isUpdateAvailable, 
    downloadedUpdate,
    isChecking,
    isDownloading,
    isUpdatePending,
    checkError,
    downloadError,
    initializationError,
    lastCheckForUpdateTimeNative,
  } = Updates.useUpdates();

  const otaSettings = useMemo((): ISettingsListRow[] => {
    return [
      // Current Update Info
      { label: "Current Update" },
      { 
        label: "Update ID", 
        value: currentlyRunning.updateId || "embedded" 
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
        value: currentlyRunning.channel || "N/A" 
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
      { label: "Update Status" },
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
      lastCheckForUpdateTimeNative && {
        label: "Last Check Time",
        value: new Date(lastCheckForUpdateTimeNative).toLocaleString(),
      },

      // New Update Info (if available)
      downloadedUpdate && [
        { label: "New Update Available" },
        { 
          label: "New Update ID",
          value: downloadedUpdate.updateId
        },
        {
          label: "Created At",
          value: downloadedUpdate.createdAt.toLocaleString()
        }
      ],

      // Error States
      checkError && [
        { label: "Check Error" },
        { 
          label: "Message", 
          value: checkError.message,
          valueStyle: { color: theme.colors.text.error }
        },
        checkError.stack && {
          label: "Stack",
          value: checkError.stack,
          valueStyle: { color: theme.colors.text.error }
        }
      ],
      
      downloadError && [
        { label: "Download Error" },
        { 
          label: "Message", 
          value: downloadError.message,
          valueStyle: { color: theme.colors.text.error }
        },
        downloadError.stack && {
          label: "Stack",
          value: downloadError.stack,
          valueStyle: { color: theme.colors.text.error }
        }
      ],
      
      initializationError && [
        { label: "Initialization Error" },
        { 
          label: "Message", 
          value: initializationError.message,
          valueStyle: { color: theme.colors.text.error }
        },
        initializationError.stack && {
          label: "Stack",
          value: initializationError.stack,
          valueStyle: { color: theme.colors.text.error }
        }
      ],
    ].flat().filter(Boolean);
  }, [
    currentlyRunning,
    isChecking,
    isDownloading,
    isUpdateAvailable,
    isUpdatePending,
    downloadedUpdate,
    checkError,
    downloadError,
    initializationError,
    lastCheckForUpdateTimeNative,
    theme.colors.text.error,
  ]);

  return <SettingsList rows={otaSettings} />;
});
```

Now let's update the main settings screen to use this component:

```typescript:features/app-settings/app-settings.screen.tsx
import { getPackageVersion } from "@/@/utils/get-package-version";
import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { Button } from "@/design-system/Button/Button";
import { HStack } from "@/design-system/HStack";
import { Text } from "@/design-system/Text";
import { VStack } from "@/design-system/VStack";
import { SettingsList } from "@/design-system/settings-list/settings-list";
import { ISettingsListRow } from "@/design-system/settings-list/settings-list.types";
import { translate } from "@/i18n";
import { useHeader } from "@/navigation/use-header";
import { useRouter } from "@/navigation/useNavigation";
import { useAppTheme } from "@/theme/useAppTheme";
import { getEnv } from "@/utils/getEnv";
import * as Updates from "expo-updates";
import { memo, useMemo } from "react";
import { useUpdatesLogEntries } from "./hooks/use-updates-log-entries";
import { OtaUpdatesList } from "./components/ota-updates-list";

export const AppSettingsScreen = memo(function AppSettingsScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { data: logEntries = [] } = useUpdatesLogEntries();
  const { isUpdateAvailable, downloadedUpdate } = Updates.useUpdates();

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

  const generalSettings = useMemo((): ISettingsListRow[] => {
    return [
      { label: "Environment", value: getEnv() },
      {
        label: "XMTP RN SDK Version",
        value: getPackageVersion("@xmtp/react-native-sdk"),
      },
      // Add Update Logs section
      { label: "Update Logs" },
      ...logEntries.map((log) => ({
        label: new Date(log.timestamp).toLocaleString(),
        value: `[${log.level}] ${log.code}: ${log.message}${
          log.stacktrace ? `\n${log.stacktrace.join("\n")}` : ""
        }${log.updateId ? `\nUpdate ID: ${log.updateId}` : ""}${
          log.assetId ? `\nAsset ID: ${log.assetId}` : ""
        }`,
      })),
    ].filter(Boolean);
  }, [logEntries]);

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={{
        paddingHorizontal: theme.spacing.lg,
      }}
    >
      {isUpdateAvailable && (
        <VStack
          style={{
            paddingVertical: theme.spacing.md,
            rowGap: theme.spacing.sm,
          }}
        >
          <Button onPress={handleReload}>Reload App to Apply Update</Button>
          <Text>
            New update available: {downloadedUpdate?.updateId} created at{" "}
            {downloadedUpdate?.createdAt.toLocaleString()}
          </Text>
        </VStack>
      )}

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

      <VStack spacing="md">
        <SettingsList rows={generalSettings} />
        <OtaUpdatesList />
      </VStack>
    </Screen>
  );
});
```

Key changes:
1. Created a new `OtaUpdatesList` component that handles all OTA update-related settings
2. Organized settings into logical groups (Current Update, Emergency Launch, Update Status, etc.)
3. Separated general settings from OTA update settings
4. Used VStack with spacing to create visual separation between the lists
5. Kept the update notification banner and debug message in the main screen
6. Moved all OTA-specific state handling to the OTA component

This makes the code more maintainable and follows the separation of concerns principle. The OTA updates functionality is now self-contained and can be easily modified without affecting the rest of the settings screen.

---

_**User**_

add stuff to reload with new update if availabe 



---

_**Assistant**_

I'll help you add the update reload functionality to the OTA updates list component:

```typescript:features/app-settings/components/ota-updates-list.tsx
import { SettingsList } from "@/design-system/settings-list/settings-list";
import { ISettingsListRow } from "@/design-system/settings-list/settings-list.types";
import { useAppTheme } from "@/theme/useAppTheme";
import * as Updates from "expo-updates";
import { memo, useMemo } from "react";
import { Button } from "@/design-system/Button/Button";
import { VStack } from "@/design-system/VStack";
import { Text } from "@/design-system/Text";
import { logger } from "@/utils/logger";

export const OtaUpdatesList = memo(function OtaUpdatesList() {
  const { theme } = useAppTheme();
  const {
    currentlyRunning,
    isUpdateAvailable,
    downloadedUpdate,
    isChecking,
    isDownloading,
    isUpdatePending,
    checkError,
    downloadError,
    initializationError,
    availableUpdate,
  } = Updates.useUpdates();

  // Handle reload when update is available
  const handleReload = async () => {
    try {
      logger.debug("[OtaUpdatesList] Reloading app to apply update...");
      await Updates.reloadAsync();
    } catch (error) {
      logger.error("[OtaUpdatesList] Failed to reload:", error);
    }
  };

  const otaSettings = useMemo((): ISettingsListRow[] => {
    return [
      // Current Update Info
      { label: "Current Update" },
      // ... rest of your settings
    ]
      .flat()
      .filter(Boolean);
  }, [/* ... your dependencies ... */]);

  return (
    <VStack spacing="md">
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
            Update ID: {downloadedUpdate?.updateId}
            {downloadedUpdate?.createdAt && (
              <>
                {"\n"}Created: {downloadedUpdate.createdAt.toLocaleString()}
              </>
            )}
          </Text>
          <Button onPress={handleReload}>Reload App to Apply Update</Button>
        </VStack>
      )}
      <SettingsList rows={otaSettings} />
    </VStack>
  );
});
```

Key changes:
1. Added a reload handler with proper logging
2. Added a banner section that shows when an update is available
3. Shows update details in the banner
4. Wrapped everything in a VStack for proper spacing
5. Added styling to make the update banner stand out
6. Used theme colors and spacing for consistency

The banner will only show when an update is available, and it provides clear information about the update along with an action button to apply it. The rest of the settings list remains unchanged below the banner.

---

_**User**_

why we'Mre not using "availableUpdate"

---

_**Assistant**_

Looking at the Expo Updates documentation, `availableUpdate` is indeed a useful property we should use. It contains information about the available update before it's downloaded, while `downloadedUpdate` is only available after the update has been downloaded.

Let's modify the component to use both:

```typescript:features/app-settings/components/ota-updates-list.tsx
// ... other imports ...

export const OtaUpdatesList = memo(function OtaUpdatesList() {
  const { theme } = useAppTheme();
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
  } = Updates.useUpdates();

  // ... handleReload ...

  const otaSettings = useMemo((): ISettingsListRow[] => {
    return [
      // ... existing current update info ...

      // Update Status
      { label: "Update Status" },
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
        { label: "Available Update" },
        {
          label: "Update ID",
          value: availableUpdate.updateId,
        },
        {
          label: "Created At",
          value: availableUpdate.createdAt.toLocaleString(),
        },
        {
          label: "Runtime Version",
          value: availableUpdate.runtimeVersion,
        },
        {
          label: "Is Emergency Launch",
          value: String(availableUpdate.isEmergencyLaunch),
        },
      ],

      // Downloaded Update Info
      downloadedUpdate && [
        { label: "Downloaded Update" },
        {
          label: "Update ID",
          value: downloadedUpdate.updateId,
        },
        {
          label: "Created At",
          value: downloadedUpdate.createdAt.toLocaleString(),
        },
        {
          label: "Runtime Version",
          value: downloadedUpdate.runtimeVersion,
        },
        {
          label: "Is Emergency Launch",
          value: String(downloadedUpdate.isEmergencyLaunch),
        },
      ],

      // ... error states ...
    ].flat().filter(Boolean);
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
  ]);

  return (
    <VStack>
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
                {(downloadedUpdate?.createdAt || availableUpdate?.createdAt).toLocaleString()}
              </>
            )}
            {"\n"}Status: {downloadedUpdate ? "Downloaded" : "Available"}
          </Text>
          <Button 
            onPress={handleReload}
            disabled={!downloadedUpdate}
          >
            {downloadedUpdate ? "Reload App to Apply Update" : "Downloading Update..."}
          </Button>
        </VStack>
      )}
      <SettingsList rows={otaSettings} />
    </VStack>
  );
});
```

Key changes:
1. Added `availableUpdate` information to the settings list
2. Separated available and downloaded update info into distinct sections
3. Updated the update banner to show status (Available vs Downloaded)
4. Disabled the reload button until the update is downloaded
5. Shows more detailed information about both update states

This gives us better visibility into the update process:
- We can see when an update is available but not yet downloaded
- We can track the update through its states (available → downloading → downloaded)
- We can compare the available/downloaded update with the currently running version

---

_**User**_

i also want a button to check for new updates. Don't forget the docs" @https://docs.expo.dev/versions/latest/sdk/updates/ "

---

_**Assistant**_

I'll add a button to manually check for updates based on the documentation. We'll use `Updates.checkForUpdateAsync()` followed by `Updates.fetchUpdateAsync()` if an update is available:

```typescript:features/app-settings/components/ota-updates-list.tsx
// ... other imports ...

export const OtaUpdatesList = memo(function OtaUpdatesList() {
  const { theme } = useAppTheme();
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
  } = Updates.useUpdates();

  // Handle reload when update is available
  const handleReload = async () => {
    try {
      logger.debug("[OtaUpdatesList] Reloading app to apply update...");
      await Updates.reloadAsync();
    } catch (error) {
      logger.error("[OtaUpdatesList] Failed to reload:", error);
    }
  };

  // Add check update function
  const handleCheckUpdate = async () => {
    try {
      logger.debug("[OtaUpdatesList] Checking for updates...");
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        logger.debug("[OtaUpdatesList] Update available, downloading...");
        await Updates.fetchUpdateAsync();
      } else {
        logger.debug("[OtaUpdatesList] No updates available");
      }
    } catch (error) {
      logger.error("[OtaUpdatesList] Failed to check/fetch updates:", error);
    }
  };

  // ... otaSettings ...

  return (
    <VStack spacing="md">
      <Button 
        onPress={handleCheckUpdate} 
        preset="secondary"
        loading={isChecking || isDownloading}
      >
        {isChecking 
          ? "Checking for Updates..." 
          : isDownloading 
          ? "Downloading Update..." 
          : "Check for Updates"}
      </Button>

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
                {(
                  downloadedUpdate?.createdAt || availableUpdate?.createdAt
                ).toLocaleString()}
              </>
            )}
            {"\n"}Status: {downloadedUpdate ? "Downloaded" : "Available"}
          </Text>
          <Button onPress={handleReload} disabled={!downloadedUpdate}>
            {downloadedUpdate
              ? "Reload App to Apply Update"
              : "Downloading Update..."}
          </Button>
        </VStack>
      )}

      <SettingsList rows={otaSettings} />
    </VStack>
  );
});
```

Key changes:
1. Added `handleCheckUpdate` function that:
   - Checks for updates using `checkForUpdateAsync()`
   - If an update is available, downloads it using `fetchUpdateAsync()`
   - Includes proper logging
2. Added a "Check for Updates" button that:
   - Shows loading state while checking/downloading
   - Changes text based on current state (checking/downloading)
   - Uses secondary preset to differentiate from the reload button
3. Added spacing between elements using `VStack spacing="md"`

This follows the example from the Expo documentation while maintaining our app's styling and error handling patterns.

---

_**User**_

For the code present, we get this error:
```
Object is possibly 'undefined'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error is coming from accessing `createdAt` when it might be undefined. Here's the fix:

```typescript:features/app-settings/components/ota-updates-list.tsx
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
```

The key change is using optional chaining for both `toLocaleString()` calls instead of trying to access it after the OR condition.

---

_**User**_

logs are kind of useless because updates will only work in preview and production on device and we won'T be able to seee the logs

---

_**Assistant**_

You're right. Instead of using `logger`, we should show the update status directly in the UI. Let's modify the error handling to display errors in the settings list:

```typescript:features/app-settings/components/ota-updates-list.tsx
// ... other imports ...

export const OtaUpdatesList = memo(function OtaUpdatesList() {
  const { theme } = useAppTheme();
  const [checkUpdateError, setCheckUpdateError] = useState<Error | null>(null);
  const [reloadError, setReloadError] = useState<Error | null>(null);

  // Handle reload when update is available
  const handleReload = async () => {
    try {
      setReloadError(null);
      await Updates.reloadAsync();
    } catch (error) {
      setReloadError(error as Error);
    }
  };

  // Add check update function
  const handleCheckUpdate = async () => {
    try {
      setCheckUpdateError(null);
      const update = await Updates.checkForUpdateAsync();
      
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
      }
    } catch (error) {
      setCheckUpdateError(error as Error);
    }
  };

  const otaSettings = useMemo((): ISettingsListRow[] => {
    return [
      // ... existing settings ...

      // Manual Check Errors
      checkUpdateError && [
        { label: "Manual Check Error" },
        { 
          label: "Message",
          value: checkUpdateError.message,
        },
      ],
      
      reloadError && [
        { label: "Reload Error" },
        {
          label: "Message",
          value: reloadError.message,
        },
      ],

      // ... rest of settings
    ].flat().filter(Boolean);
  }, [
    // ... existing dependencies ...
    checkUpdateError,
    reloadError,
  ]);

  // ... rest of component
});
```

Key changes:
1. Removed all `logger` usage
2. Added state for manual check and reload errors
3. Show these errors in the settings list
4. Clear errors when retrying operations

This way users can see what's happening with updates directly in the app, which is more useful when testing on preview/production builds.

---



---

