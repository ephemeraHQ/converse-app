## SpecStory

## Refactoring Profile Header Code (2/10/2025, 3:14:07 PM)

_**User**_

remove everything related to isMyProfile. because this the header from antoher user

---

_**Assistant**_

I'll help remove everything related to `isMyProfile` since this is the header for viewing other users' profiles. I'll also fix the other linting errors.

```typescript:features/profiles/profile-other.screen-header.tsx
// ... existing code ...

export function useProfileOtherScreenHeader({ inboxId }: { inboxId: InboxId }) {
  const { theme, themed } = useAppTheme();
  const router = useRouter();

  const editMode = useProfileMeStoreValue(inboxId, (s) => s.editMode);

  const profileMeStoreActions = useProfileMeStoreValue(
    inboxId,
    (s) => s.actions
  );

  const handleChatPress = useCallback(() => {
    // TODO: New conversation flow. Need to adapt. Check with Thierry
    // "searchSelectedUserInboxIds" will show the conversation search composer which we might not want.
    // Might need to change for just "inboxIds" and if we can find a conversation we won't show the composer otherwise we show it like it's a new conversation?
    router.push("Conversation", {
      searchSelectedUserInboxIds: [inboxId],
    });
  }, [router, inboxId]);

  const handleDoneEditProfile = useCallback(async () => {
    try {
      // TODO: Need to check to make sure
      // await saveProfileAsync();
      profileMeStoreActions.setEditMode(false);
    } catch (error) {
      captureErrorWithToast(error);
    }
  }, [profileMeStoreActions]);

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
        // TODO: Update with new backend
        // case "block": ...
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
          {editMode ? (
            <Button
              text={translate("userProfile.done")}
              variant="text"
              onPress={handleDoneEditProfile}
            />
          ) : (
            <>
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
                  // TODO: This was using previous logic but we'll need to change with new backend
                  // Block action commented out
                ]}
              >
                <HeaderAction icon="more_vert" />
              </DropdownMenu>
            </>
          )}
        </HStack>
      ),
    },
    [
      router,
      theme,
      editMode,
      handleChatPress,
      handleContextMenuAction,
      handleDoneEditProfile,
    ]
  );
}

// ... existing styles ...
```

Key changes made:

1. Removed duplicate `useRouter` import and usage
2. Added proper type for the hook parameters
3. Removed all `isMyProfile` related code since this is for viewing other profiles
4. Simplified the share functionality to use `inboxId` instead of `peerAddress`
5. Removed unnecessary menu items that were only for the user's own profile
6. Fixed dependency arrays in useCallback hooks
7. Removed unused imports and variables

The header now only shows the chat button and a dropdown menu with the share option, which is appropriate for viewing other users' profiles.

---



---

