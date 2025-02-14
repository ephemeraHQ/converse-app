## SpecStory

## Creating a Debug Screen in React (1/27/2025, 9:54:25 AM)

_**User**_

i want something like thos. it's not the right imporst but you get the points... 

import { memo } from "react"
import { Screen } from "../components/screen/screen"
import { ScreenHeaderIconButton } from "../components/screen/screen-header-icon-button"
import { env } from "../constants/env"
import { VStack } from "../design-system/blocks"
import { iconRegistry } from "../design-system/icon/icon-name-registry"
import {
  useSafeAreaBottomInset,
  useSafeAreaTopInset,
} from "../design-system/safe-area"
import { ITextProps, Text } from "../design-system/text"
import { ProfileScreenHeader } from "../features/profile/profile-screen-header"
import { useRouter } from "../hooks/smarts/use-navigation"
import { currentUserIsOwner } from "../services/user-service/user-service"

export const ProfileDebugScreen = memo(function ProfileDebugScreen() {
  const router = useRouter()

  const bottomInset = useSafeAreaBottomInset()
  const topInset = useSafeAreaTopInset()

  return (
    <Screen>
      <ProfileScreenHeader>
        <ScreenHeaderIconButton
          onPress={router.goBack}
          iconName={iconRegistry["close"]}
        />
      </ProfileScreenHeader>
      <VStack
        space="2"
        px="4"
      >
        <DebugText>Env: {env.environment}</DebugText>
        <DebugText>
          Release channel: {env.releaseChannel || "unknown"}
        </DebugText>
        <DebugText>Version: {env.version || "unknown"}</DebugText>
        {!!env.nativeVersion && (
          <DebugText>Native version: {env.nativeVersion}</DebugText>
        )}
        {!!env.lastNativeUpdate && (
          <DebugText>Last native update: {env.lastNativeUpdate}</DebugText>
        )}
        {!!env.releaseType && (
          <DebugText>Release type: {env.releaseType}</DebugText>
        )}
        {!!env.applicationId && (
          <DebugText>Application id: {env.applicationId}</DebugText>
        )}
        {!!env.applicationName && (
          <DebugText>Application name (dev): {env.applicationName}</DebugText>
        )}
        {!!env.expoUpdateId && (
          <DebugText>Update id: {env.expoUpdateId}</DebugText>
        )}

        {!!env.expoUpdateCreatedAt && (
          <DebugText>
            Update created at: {env.expoUpdateCreatedAt.toDateString()}
          </DebugText>
        )}

        {currentUserIsOwner() && (
          <>
            {!!env.expoProjectId && (
              <DebugText>Project id: {env.expoProjectId}</DebugText>
            )}
            <DebugText>Has notch: {String(env.hasTopNotch)}</DebugText>
            <DebugText>Is small phone: {String(env.isSmallPhone)}</DebugText>
            <DebugText>Top notch height: {topInset}</DebugText>
            <DebugText>Bottom notch height: {bottomInset}</DebugText>
            <DebugText>Device type: {String(env.deviceType)}</DebugText>
            <DebugText>Device brand: {String(env.deviceBrand)}</DebugText>
            <DebugText>Device model: {String(env.deviceModel)}</DebugText>
          </>
        )}
      </VStack>
    </Screen>
  )
})

function DebugText(props: ITextProps) {
  return (
    <Text
      fontSize="xs"
      {...props}
    />
  )
}


---

_**Assistant**_

I'll help you create a similar debug screen for app settings. Here's how we can modify the current file with the appropriate imports and structure:

```typescript:features/app-settings/app-settings.screen.tsx
import { memo } from "react";
import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { VStack } from "@/design-system/blocks";
import { Text } from "@/design-system/text";
import { env } from "@/constants/env";
import { useSafeAreaBottomInset, useSafeAreaTopInset } from "@/design-system/safe-area";
import { currentUserIsOwner } from "@/services/user-service/user-service";

// ... existing code ...

export const AppSettingsScreen = memo(function AppSettingsScreen() {
  const bottomInset = useSafeAreaBottomInset();
  const topInset = useSafeAreaTopInset();

  return (
    <Screen>
      <VStack space="2" px="4">
        <DebugText>Env: {env.environment}</DebugText>
        <DebugText>Version: {env.version || "unknown"}</DebugText>
        
        {currentUserIsOwner() && (
          <>
            <DebugText>Has notch: {String(env.hasTopNotch)}</DebugText>
            <DebugText>Is small phone: {String(env.isSmallPhone)}</DebugText>
            <DebugText>Top notch height: {topInset}</DebugText>
            <DebugText>Bottom notch height: {bottomInset}</DebugText>
            <DebugText>Device type: {String(env.deviceType)}</DebugText>
          </>
        )}
      </VStack>
    </Screen>
  );
});

function DebugText({ children }: { children: React.ReactNode }) {
  return (
    <Text fontSize="xs">
      {children}
    </Text>
  );
}
```

I've made the following changes:
1. Added necessary imports
2. Wrapped the component with `memo`
3. Added a basic debug information display using `VStack` and `DebugText`
4. Created a simple `DebugText` component for consistent text styling
5. Added conditional rendering for owner-only information
6. Used proper path aliases with `@/` as per the style guide

The structure is similar to the ProfileDebugScreen but simplified. You can add more debug information as needed.

---



---

