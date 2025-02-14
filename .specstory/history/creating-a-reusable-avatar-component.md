## SpecStory

## Creating a Reusable Avatar Component (1/17/2025, 11:06:34 AM)

_**User**_

create external component for the <pressable and avatar, 

---

_**Assistant**_

I'll help you extract the avatar pressable into a separate component. Based on the style guide, I'll keep it in the same file and place it near the related component.

```typescript:features/conversation-list/conversation-list.screen-header.tsx
// ... existing code ...

function HeaderTitle() {
  const { theme, themed } = useAppTheme();
  const navigation = useNavigation();
  const currentAccount = useCurrentAccount();
  const preferredName = usePreferredName(currentAccount!);
  const accountsProfilesNames = useAccountsProfiles();
  const accounts = useAccountsList();
  const setCurrentAccount = useAccountsStore((s) => s.setCurrentAccount);

  const onDropdownPress = useCallback(
    // ... existing code ...
  );

  return (
    <HStack style={$titleContainer}>
      <ProfileAvatar />
      <DropdownMenu
        // ... existing code ...
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

function ProfileAvatar() {
  const { theme, themed } = useAppTheme();
  const navigation = useNavigation();
  const currentAccount = useCurrentAccount();

  return (
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
  );
}

// ... existing code ...
```

I've created a new `ProfileAvatar` component that encapsulates the Pressable and Avatar logic. The component is placed right after the `HeaderTitle` component since they're closely related. This follows our style guide principles of:
1. Keeping related code close together
2. Extracting reusable components
3. Maintaining the same file for closely related components
4. Moving the required hooks and props to the new component

The changes make the `HeaderTitle` component cleaner and more focused on its primary responsibility.

---



---

