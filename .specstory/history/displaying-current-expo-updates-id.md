## SpecStory

## Displaying Current Expo Updates ID (1/27/2025, 10:02:57 AM)

_**User**_

how can i disaply current expo updates id

---

_**Assistant**_

I'll help you add the expo updates ID display to your app settings screen. First, we'll need to import the Updates module from expo-updates and then add it to your debug information.

Here's how to modify the file:

```typescript:features/app-settings/app-settings.screen.tsx
import { memo } from "react";
import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { VStack } from "@/design-system/VStack";
import * as Updates from 'expo-updates';

export const AppSettingsScreen = memo(function AppSettingsScreen() {
  const bottomInset = useSafeAreaBottomInset();
  const topInset = useSafeAreaTopInset();

  return (
    <Screen>
      <VStack>
        <DebugText>Env: {env.environment}</DebugText>
        <DebugText>Version: {env.version || "unknown"}</DebugText>
        <DebugText>Update ID: {Updates.updateId || "no update installed"}</DebugText>
        <DebugText>Has notch: {String(env.hasTopNotch)}</DebugText>
        // ... existing code ...
      </VStack>
    </Screen>
  );
});
```

The changes include:
1. Adding the import for expo-updates
2. Adding a new `DebugText` component to display the update ID

The `Updates.updateId` will show the current update ID if one is installed, or we'll show "no update installed" as a fallback if there isn't one.

Make sure you have `expo-updates` installed in your project. If you don't, you'll need to install it with:
```bash
expo install expo-updates
```

---



---

