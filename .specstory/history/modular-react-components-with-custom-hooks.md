## SpecStory

## Modular React Components with Custom Hooks (1/17/2025, 11:03:40 AM)

_**User**_

create separte component that will use their own hooks, try to pass as less props as possible

---

_**Assistant**_

I'll help you extract the header components to make the code more maintainable. Based on the style guide, I'll create separate components in the same file and keep related code together.

```typescript:features/conversation-list/conversation-list.screen-header.tsx
// ... existing code ...

export function useHeaderWrapper() {
  const { theme, themed } = useAppTheme();
  const navigation = useNavigation();
  const currentAccount = useCurrentAccount();
  const accounts = useAccountsList();
  const setCurrentAccount = useAccountsStore((s) => s.setCurrentAccount);

  useHeader(
    {
      safeAreaEdges: ["top"],
      RightActionComponent: <HeaderRightActions />,
      titleComponent: <HeaderTitle 
        onAccountSelect={setCurrentAccount}
        accounts={accounts}
      />,
    },
    [accounts, setCurrentAccount]
  );
}

function HeaderRightActions() {
  const navigation = useNavigation();
  const { theme } = useAppTheme();

  return (
    <HStack style={themed($rightContainer)}>
      <HeaderAction
        icon="qrcode"
        onPress={() => {
          navigation.navigate("ShareProfile");
        }}
      />
      <HeaderAction
        style={$newConversationContainer}
        icon="square.and.pencil"
        onPress={() => {
          navigation.navigate("CreateConversation");
        }}
      />
    </HStack>
  );
}

type HeaderTitleProps = {
  onAccountSelect: (accountId: string, shouldSync: boolean) => void;
  accounts: string[];
};

function HeaderTitle({ onAccountSelect, accounts }: HeaderTitleProps) {
  const { theme, themed } = useAppTheme();
  const navigation = useNavigation();
  const currentAccount = useCurrentAccount();
  const preferredName = usePreferredName(currentAccount!);
  const accountsProfilesNames = useAccountsProfiles();

  const onDropdownPress = useCallback(
    (actionId: string) => {
      if (actionId === "all-chats") {
        Alert.alert("Coming soon");
      } else if (actionId === "new-account") {
        navigation.navigate("NewAccountNavigator");
      } else if (actionId === "app-settings") {
        Alert.alert("Coming soon");
      } else {
        onAccountSelect(actionId, false);
      }
    },
    [navigation, onAccountSelect]
  );

  return (
    <HStack style={$titleContainer}>
      <Pressable
        onPress={() => {
          navigation.navigate("Profile", {
            address: currentAccount!,
          });
        }}
        hitSlop={theme.spacing.sm}
      >
        <Center style={themed($avatarContainer)}>
          <Avatar size={theme.avatarSize.sm} />
        </Center>
      </Pressable>
      <DropdownMenu
        style={themed($dropDownMenu)}
        onPress={onDropdownPress}
        actions={[
          ...accountsProfilesNames.map((profilePreferedName, index) => ({
            id: accounts[index],
            title: shortDisplayName(profilePreferedName),
            image: currentAccount === accounts[index] ? "checkmark" : "",
          })),
          {
            displayInline: true,
            id: "new-account",
            title: translate("new_account"),
            image: iconRegistry["new-account-card"],
          },
          {
            displayInline: true,
            id: "app-settings",
            title: translate("app_settings"),
            image: iconRegistry["settings"],
          },
        ]}
      >
        <HStack style={themed($rowContainer)}>
          <Text>{shortDisplayName(preferredName)}</Text>
          <Center style={themed($iconContainer)}>
            <Icon
              color={theme.colors.text.secondary}
              icon="chevron.down"
              size={theme.iconSize.xs}
            />
          </Center>
        </HStack>
      </DropdownMenu>
    </HStack>
  );
}
```

I've made the following changes:

1. Extracted `HeaderRightActions` as a separate component that uses its own navigation and theme hooks
2. Extracted `HeaderTitle` as a separate component with minimal props:
   - `onAccountSelect`: Function to change accounts
   - `accounts`: List of account IDs
3. Each component now manages its own state and hooks, reducing prop drilling
4. Kept all components in the same file as per the style guide
5. Maintained the existing styling and functionality while making the code more modular and maintainable

The main `useHeaderWrapper` hook is now much simpler and only passes the essential props needed for account management.

---

_**User**_

use acocunts hook and setcurrentAcocunt inside the header title. told you to not pass props. reuse hooks inthe componenet

---

_**Assistant**_

You're right - according to the style guide, we should minimize props and reuse hooks directly in the components. Here's the corrected version:

```typescript:features/conversation-list/conversation-list.screen-header.tsx
// ... existing code ...

export function useHeaderWrapper() {
  useHeader(
    {
      safeAreaEdges: ["top"],
      RightActionComponent: <HeaderRightActions />,
      titleComponent: <HeaderTitle />,
    },
    []
  );
}

function HeaderRightActions() {
  const navigation = useNavigation();
  const { theme } = useAppTheme();

  return (
    <HStack style={themed($rightContainer)}>
      <HeaderAction
        icon="qrcode"
        onPress={() => {
          navigation.navigate("ShareProfile");
        }}
      />
      <HeaderAction
        style={$newConversationContainer}
        icon="square.and.pencil"
        onPress={() => {
          navigation.navigate("CreateConversation");
        }}
      />
    </HStack>
  );
}

function HeaderTitle() {
  const { theme, themed } = useAppTheme();
  const navigation = useNavigation();
  const currentAccount = useCurrentAccount();
  const preferredName = usePreferredName(currentAccount!);
  const accountsProfilesNames = useAccountsProfiles();
  const accounts = useAccountsList();
  const setCurrentAccount = useAccountsStore((s) => s.setCurrentAccount);

  const onDropdownPress = useCallback(
    (actionId: string) => {
      if (actionId === "all-chats") {
        Alert.alert("Coming soon");
      } else if (actionId === "new-account") {
        navigation.navigate("NewAccountNavigator");
      } else if (actionId === "app-settings") {
        Alert.alert("Coming soon");
      } else {
        setCurrentAccount(actionId, false);
      }
    },
    [navigation, setCurrentAccount]
  );

  return (
    <HStack style={$titleContainer}>
      <Pressable
        onPress={() => {
          navigation.navigate("Profile", {
            address: currentAccount!,
          });
        }}
        hitSlop={theme.spacing.sm}
      >
        <Center style={themed($avatarContainer)}>
          <Avatar size={theme.avatarSize.sm} />
        </Center>
      </Pressable>
      <DropdownMenu
        style={themed($dropDownMenu)}
        onPress={onDropdownPress}
        actions={[
          ...accountsProfilesNames.map((profilePreferedName, index) => ({
            id: accounts[index],
            title: shortDisplayName(profilePreferedName),
            image: currentAccount === accounts[index] ? "checkmark" : "",
          })),
          {
            displayInline: true,
            id: "new-account",
            title: translate("new_account"),
            image: iconRegistry["new-account-card"],
          },
          {
            displayInline: true,
            id: "app-settings",
            title: translate("app_settings"),
            image: iconRegistry["settings"],
          },
        ]}
      >
        <HStack style={themed($rowContainer)}>
          <Text>{shortDisplayName(preferredName)}</Text>
          <Center style={themed($iconContainer)}>
            <Icon
              color={theme.colors.text.secondary}
              icon="chevron.down"
              size={theme.iconSize.xs}
            />
          </Center>
        </HStack>
      </DropdownMenu>
    </HStack>
  );
}
```

I've made these changes:
1. Removed all props from `HeaderTitle` and moved the hooks directly into the component
2. Simplified `useHeaderWrapper` to only provide the component structure
3. Each component now independently manages its own state using the necessary hooks

This follows the style guide's recommendation to minimize props and reuse hooks within components where needed.

---



---

