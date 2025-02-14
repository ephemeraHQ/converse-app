## SpecStory

## Certainly! We can create a few custom hooks to clean up the `Main` component and improve its readability. Here are some suggestions for reusable hooks:

1. **useMainHeaders**: This hook can encapsulate the logic for rendering the main headers.
2. **useNavigationDrawer**: This hook can handle the navigation drawer logic.
3. **useUserStatus**: This hook can manage user-related states and checks.

Here's how we can implement these hooks and refactor the `Main` component:

```typescript
// New custom hooks
const useMainHeaders = (colorScheme: ColorSchemeName) => {
  return (
    <>
      {Platform.OS !== "web" && (
        <>
          <HydrationStateHandler />
          <InitialStateHandler />
        </>
      )}
      {Platform.OS === "android" && (
        <StatusBar backgroundColor={backgroundColor(colorScheme)} />
      )}
      <NetworkStateHandler />
      <MainIdentityStateHandler />
      <ConversationsStateHandler />
      <ActionSheetStateHandler />
      <WalletsStateHandler />
    </>
  );
};

const useNavigationDrawer = () => {
  const navigationDrawer = useRef<any>(null);
  
  const toggleNavigationDrawer = useCallback((open: boolean) => {
    if (open) {
      navigationDrawer.current?.openDrawer();
    } else {
      navigationDrawer.current?.closeDrawer();
    }
  }, []);
  
  useEffect(() => {
    converseEventEmitter.on("toggle-navigation-drawer", toggleNavigationDrawer);
    return () => {
      converseEventEmitter.off("toggle-navigation-drawer", toggleNavigationDrawer);
    };
  }, [toggleNavigationDrawer]);

  return { navigationDrawer, toggleNavigationDrawer };
};

const useUserStatus = () => {
  const userAddress = useCurrentAccount();
  const socials = useProfilesStore((s) =>
    userAddress ? getProfile(userAddress, s.profiles)?.socials : undefined
  );
  const currentUserName = socials?.userNames?.find((e) => e.isPrimary);
  const { resetOnboarding, addingNewAccount } = useOnboardingStore(
    useSelect(["resetOnboarding", "addingNewAccount"])
  );
  
  useEffect(() => {
    if (userAddress && !addingNewAccount) {
      resetOnboarding();
    }
  }, [addingNewAccount, resetOnboarding, userAddress]);

  return { userAddress, currentUserName, addingNewAccount };
};

export default function Main() {
  usePrivyAccessToken();
  useAddressBookStateHandler();
  useCheckCurrentInstallation();
  const colorScheme = useColorScheme();
  const isSplitScreen = useIsSplitScreen();

  const { notifications } = useSettingsStore(useSelect(["notifications"]));
  const { notificationsPermissionStatus, splashScreenHidden } = useAppStore(
    useSelect(["notificationsPermissionStatus", "splashScreenHidden"])
  );

  const mainHeaders = useMainHeaders(colorScheme);
  const { navigationDrawer } = useNavigationDrawer();
  const { userAddress, currentUserName, addingNewAccount } = useUserStatus();

  // ... rest of the component logic ...

  // The return statements remain the same, just use the new variables from the hooks
}
```

This refactoring introduces three new custom hooks:

1. **useMainHeaders**: Encapsulates the logic for rendering the main headers.
2. **useNavigationDrawer**: Manages the navigation drawer state and event listeners.
3. **useUserStatus**: Handles user-related state and effects.

These hooks help to separate concerns and make the `Main` component more readable and maintainable. The main component logic remains largely the same, but it now uses the variables and functions provided by these custom hooks.

To implement this change, you would need to:

1. Add the new custom hooks at the top of the file.
2. Update the `Main` component to use these new hooks.
3. Remove the now-redundant code from the `Main` component.

This refactoring doesn't change the functionality but makes the code more modular and easier to maintain. (9/26/2024, 11:25:27 AM)

_**User**_

do you think we could create any reusable hooks here to make things cleaner?

---

_**Assistant**_

Certainly! We can create a few custom hooks to clean up the `Main` component and improve its readability. Here are some suggestions for reusable hooks:

1. `useMainHeaders`: This hook can encapsulate the logic for rendering the main headers.
2. `useNavigationDrawer`: This hook can handle the navigation drawer logic.
3. `useUserStatus`: This hook can manage user-related states and checks.

Here's how we can implement these hooks and refactor the `Main` component:

```typescript:screens/Main.tsx
// ... existing imports ...
import { useState, useEffect, useCallback } from "react";

// New custom hooks
const useMainHeaders = (colorScheme: ColorSchemeName) => {
  return (
    <>
      {Platform.OS !== "web" && (
        <>
          <HydrationStateHandler />
          <InitialStateHandler />
        </>
      )}
      {Platform.OS === "android" && (
        <StatusBar backgroundColor={backgroundColor(colorScheme)} />
      )}
      <NetworkStateHandler />
      <MainIdentityStateHandler />
      <ConversationsStateHandler />
      <ActionSheetStateHandler />
      <WalletsStateHandler />
    </>
  );
};

const useNavigationDrawer = () => {
  const navigationDrawer = useRef<any>(null);
  
  const toggleNavigationDrawer = useCallback((open: boolean) => {
    if (open) {
      navigationDrawer.current?.openDrawer();
    } else {
      navigationDrawer.current?.closeDrawer();
    }
  }, []);
  
  useEffect(() => {
    converseEventEmitter.on("toggle-navigation-drawer", toggleNavigationDrawer);
    return () => {
      converseEventEmitter.off("toggle-navigation-drawer", toggleNavigationDrawer);
    };
  }, [toggleNavigationDrawer]);

  return { navigationDrawer, toggleNavigationDrawer };
};

const useUserStatus = () => {
  const userAddress = useCurrentAccount();
  const socials = useProfilesStore((s) =>
    userAddress ? getProfile(userAddress, s.profiles)?.socials : undefined
  );
  const currentUserName = socials?.userNames?.find((e) => e.isPrimary);
  const { resetOnboarding, addingNewAccount } = useOnboardingStore(
    useSelect(["resetOnboarding", "addingNewAccount"])
  );
  
  useEffect(() => {
    if (userAddress && !addingNewAccount) {
      resetOnboarding();
    }
  }, [addingNewAccount, resetOnboarding, userAddress]);

  return { userAddress, currentUserName, addingNewAccount };
};

export default function Main() {
  usePrivyAccessToken();
  useAddressBookStateHandler();
  useCheckCurrentInstallation();
  const colorScheme = useColorScheme();
  const isSplitScreen = useIsSplitScreen();

  const { notifications } = useSettingsStore(useSelect(["notifications"]));
  const { notificationsPermissionStatus, splashScreenHidden } = useAppStore(
    useSelect(["notificationsPermissionStatus", "splashScreenHidden"])
  );

  const mainHeaders = useMainHeaders(colorScheme);
  const { navigationDrawer } = useNavigationDrawer();
  const { userAddress, currentUserName, addingNewAccount } = useUserStatus();

  // ... rest of the component logic ...

  // The return statements remain the same, just use the new variables from the hooks
}
```

This refactoring introduces three new custom hooks:

1. `useMainHeaders`: Encapsulates the logic for rendering the main headers.
2. `useNavigationDrawer`: Manages the navigation drawer state and event listeners.
3. `useUserStatus`: Handles user-related state and effects.

These hooks help to separate concerns and make the `Main` component more readable and maintainable. The main component logic remains largely the same, but it now uses the variables and functions provided by these custom hooks.

To implement this change, you would need to:

1. Add the new custom hooks at the top of the file.
2. Update the `Main` component to use these new hooks.
3. Remove the now-redundant code from the `Main` component.

This refactoring doesn't change the functionality but makes the code more modular and easier to maintain.

---

_**User**_

actually mainHeaders should be a component no?

---

_**Assistant**_

You're absolutely right. I apologize for the oversight. Converting `mainHeaders` to a component is indeed a better approach. Let's refactor the code to make `MainHeaders` a separate component. Here's how we can modify the code:

```typescript:screens/Main.tsx
// ... existing imports ...
import { useState, useEffect, useCallback } from "react";

// New MainHeaders component
const MainHeaders: React.FC<{ colorScheme: ColorSchemeName }> = ({ colorScheme }) => (
  <>
    {Platform.OS !== "web" && (
      <>
        <HydrationStateHandler />
        <InitialStateHandler />
      </>
    )}
    {Platform.OS === "android" && (
      <StatusBar backgroundColor={backgroundColor(colorScheme)} />
    )}
    <NetworkStateHandler />
    <MainIdentityStateHandler />
    <ConversationsStateHandler />
    <ActionSheetStateHandler />
    <WalletsStateHandler />
  </>
);

const useNavigationDrawer = () => {
  const navigationDrawer = useRef<any>(null);
  
  const toggleNavigationDrawer = useCallback((open: boolean) => {
    if (open) {
      navigationDrawer.current?.openDrawer();
    } else {
      navigationDrawer.current?.closeDrawer();
    }
  }, []);
  
  useEffect(() => {
    converseEventEmitter.on("toggle-navigation-drawer", toggleNavigationDrawer);
    return () => {
      converseEventEmitter.off("toggle-navigation-drawer", toggleNavigationDrawer);
    };
  }, [toggleNavigationDrawer]);

  return { navigationDrawer, toggleNavigationDrawer };
};

const useUserStatus = () => {
  const userAddress = useCurrentAccount();
  const socials = useProfilesStore((s) =>
    userAddress ? getProfile(userAddress, s.profiles)?.socials : undefined
  );
  const currentUserName = socials?.userNames?.find((e) => e.isPrimary);
  const { resetOnboarding, addingNewAccount } = useOnboardingStore(
    useSelect(["resetOnboarding", "addingNewAccount"])
  );
  
  useEffect(() => {
    if (userAddress && !addingNewAccount) {
      resetOnboarding();
    }
  }, [addingNewAccount, resetOnboarding, userAddress]);

  return { userAddress, currentUserName, addingNewAccount };
};

export default function Main() {
  usePrivyAccessToken();
  useAddressBookStateHandler();
  useCheckCurrentInstallation();
  const colorScheme = useColorScheme();
  const isSplitScreen = useIsSplitScreen();

  const { notifications } = useSettingsStore(useSelect(["notifications"]));
  const { notificationsPermissionStatus, splashScreenHidden } = useAppStore(
    useSelect(["notificationsPermissionStatus", "splashScreenHidden"])
  );

  const { navigationDrawer } =

---



---

