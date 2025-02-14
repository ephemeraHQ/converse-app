## SpecStory

## Profile Header Code Cleanup (2/10/2025, 3:14:33 PM)

_**User**_

remove all myPrfile stuff this is the ehader for antoehr user

---

_**Assistant**_

I'll help clean up the profile-other.screen-header.tsx file by removing all the "myProfile" related code since this is for viewing other users' profiles. Here are the necessary edits:

```typescript:features/profiles/profile-other.screen-header.tsx
// ... existing code ...

export function useProfileOtherScreenHeader({ inboxId }: { inboxId: InboxId }) {
  const { theme, themed } = useAppTheme();
  const router = useRouter();

  const handleChatPress = useCallback(() => {
    router.push("Conversation", {
      searchSelectedUserInboxIds: [inboxId],
    });
  }, [router, inboxId]);

  const handleContextMenuAction = useCallback(
    async (actionId: string) => {
      Haptics.selectionAsync();
      switch (actionId) {
        case "share": {
          const shareUrl = `${config.websiteDomain}/profile/${inboxId}`;
          await Share.share({
            message: shareUrl,
          });
          break;
        }
      }
    },
    [inboxId]
  );

  useHeader(
    {
      backgroundColor: theme.colors.background.surface,
      safeAreaEdges: ["top"],
      titleComponent: (
        <Text preset="body">
          {router.canGoBack()
            ? router.getState().routes[router.getState().routes.length - 2].name
            : ""}
        </Text>
      ),
      LeftActionComponent: (
        <HeaderAction
          icon="chevron.left"
          onPress={() => {
            router.goBack();
          }}
        />
      ),
      RightActionComponent: (
        <HStack style={themed($headerRightContainer)}>
          <HeaderAction
            style={themed($chatIcon)}
            icon="square.and.pencil"
            onPress={handleChatPress}
          />
          <DropdownMenu
            style={themed($dropdownMenu)}
            onPress={handleContextMenuAction}
            actions={[
              {
                id: "share",
                title: translate("share"),
                image: iconRegistry["square.and.arrow.up"],
              },
            ]}
          >
            <HeaderAction icon="more_vert" />
          </DropdownMenu>
        </HStack>
      ),
    },
    [router, theme, handleChatPress, handleContextMenuAction]
  );
}

// ... existing styled components ...
```

Key changes made:
1. Removed duplicate router imports and declarations
2. Added proper type for the hook parameters
3. Removed all myProfile related code and checks since this header is for viewing other profiles
4. Removed edit mode functionality since users can't edit other profiles
5. Simplified the header actions to only show chat and share options
6. Updated dependencies in useCallback and useHeader hooks
7. Fixed the share URL to use inboxId instead of peerAddress
8. Removed unused imports and variables

The header now properly reflects functionality for viewing other users' profiles with options to chat with them or share their profile.

---



---

