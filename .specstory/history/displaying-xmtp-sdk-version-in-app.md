## SpecStory

## Displaying XMTP SDK Version in App (2/11/2025, 9:23:45 AM)

_**User**_

how can i show the version of the xmtp sdk we're using? Maybe read the package.json? is that the best way?

---

_**Assistant**_

I'll help you add the XMTP SDK version to the app settings screen. Reading from package.json is a good approach. We can use a utility function to get the version and display it in the settings list.

First, let's create a utility function to get package versions:

```typescript:@/utils/get-package-version.ts
// Import the package.json content
import packageJson from "../../package.json";

export function getPackageVersion(packageName: string): string {
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  
  return dependencies[packageName] || "unknown";
}
```

Now let's update the app settings screen to show the XMTP SDK version:

```typescript:features/app-settings/app-settings.screen.tsx
// ... existing imports ...
import { getPackageVersion } from "@/utils/get-package-version";

export const AppSettingsScreen = memo(function AppSettingsScreen() {
  // ... existing code ...

  const allSettings = useMemo((): ISettingsListRow[] => {
    return [
      { label: "Environment", value: getEnv() },
      { label: "XMTP SDK Version", value: getPackageVersion("@xmtp/react-native-sdk") },
      { label: "Update ID", value: currentlyRunning.updateId || "embedded" },
      // ... rest of the existing settings ...
    ].filter(Boolean);
  }, [currentlyRunning, isChecking, isDownloading, downloadedUpdate]);

  // ... rest of the component ...
});
```

This approach:
1. Creates a reusable utility function to get package versions
2. Adds the XMTP SDK version near the top of the settings list
3. Will show the exact version from your package.json

The version will be displayed in the format it appears in package.json (e.g., "^1.0.0" or "1.0.0" depending on how it's specified in your dependencies).

---



---

