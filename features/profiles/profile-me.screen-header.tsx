import { InboxId } from "@xmtp/react-native-sdk";
import React, { memo, useCallback, useState } from "react";
import { ViewStyle } from "react-native";
import { Button } from "@/design-system/Button/Button";
import { DropdownMenu } from "@/design-system/dropdown-menu/dropdown-menu";
import { HeaderAction } from "@/design-system/Header/HeaderAction";
import { HStack } from "@/design-system/HStack";
import { iconRegistry } from "@/design-system/Icon/Icon";
import { Text } from "@/design-system/Text";
import {
  useProfileMeStore,
  useProfileMeStoreValue,
} from "@/features/profiles/profile-me.store";
import { translate } from "@/i18n";
import { navigate } from "@/navigation/navigation.utils";
import { useHeader } from "@/navigation/use-header";
import { useRouter } from "@/navigation/use-navigation";
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme";
import { captureErrorWithToast } from "@/utils/capture-error";
import { Haptics } from "@/utils/haptics";
import { useProfileQuery } from "@/features/profiles/profiles.query";
import { useSaveProfile } from "@/features/profiles/hooks";

export function useProfileMeScreenHeader(args: { inboxId: InboxId }) {
  const { inboxId } = args;

  const { theme, themed } = useAppTheme();

  const router = useRouter();

  const editMode = useProfileMeStoreValue(inboxId, (s) => s.editMode);

  const profileMeStore = useProfileMeStore(inboxId);

  const { data: profile } = useProfileQuery({ xmtpId: inboxId });

  const handleContextMenuAction = useCallback(
    async (actionId: string) => {
      Haptics.selectionAsync();
      switch (actionId) {
        case "edit":
          // Initialize the store with current profile values before entering edit mode
          if (profile) {
            // Set the store values to match the current profile
            profileMeStore.getState().actions.setNameTextValue(profile.name || '');
            profileMeStore.getState().actions.setUsernameTextValue(profile.username || '');
            profileMeStore.getState().actions.setDescriptionTextValue(profile.description || '');
            if (profile.avatar) {
              profileMeStore.getState().actions.setAvatarUri(profile.avatar);
            }
          }
          // Enable edit mode to show editable fields
          profileMeStore.getState().actions.setEditMode(true);
          break;
        case "share":
          router.navigate("ShareProfile");
          break;
      }
    },
    [profileMeStore, router, profile],
  );

  // Handle canceling edit mode
  const handleCancelEdit = useCallback(() => {
    // Reset the store and exit edit mode
    profileMeStore.getState().actions.reset();
    profileMeStore.getState().actions.setEditMode(false);
  }, [profileMeStore]);

  useHeader(
    {
      backgroundColor: theme.colors.background.surface,
      safeAreaEdges: ["top"],
      titleComponent: editMode ? undefined : (
        <Text preset="body">
          {router.canGoBack()
            ? router.getState().routes[router.getState().routes.length - 2].name
            : ""}
        </Text>
      ),
      LeftActionComponent: editMode ? (
        // Show Cancel button when in edit mode
        <Button
          text={translate("Cancel")}
          variant="text"
          onPress={handleCancelEdit}
        />
      ) : (
        // Show back button when not in edit mode
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
            <DoneAction inboxId={inboxId} />
          ) : (
            <>
              <HeaderAction
                icon="qrcode"
                onPress={() => {
                  navigate("ShareProfile");
                }}
              />
              <DropdownMenu
                style={themed($dropdownMenu)}
                onPress={handleContextMenuAction}
                actions={[
                  {
                    id: "edit",
                    title: translate("Edit"),
                    image: iconRegistry["pencil"],
                  },
                  {
                    id: "share",
                    title: translate("Share"),
                    image: iconRegistry["square.and.arrow.up"],
                  },
                ]}
              >
                <HeaderAction icon="more_vert" />
              </DropdownMenu>
            </>
          )}
        </HStack>
      ),
    },
    [router, theme, editMode, handleContextMenuAction, inboxId, handleCancelEdit],
  );
}

const DoneAction = memo(function DoneAction({ inboxId }: { inboxId: InboxId }) {
  const profileMeStore = useProfileMeStore(inboxId);
  const { data: profile } = useProfileQuery({ xmtpId: inboxId });
  const { saveProfile, isSaving, isSuccess } = useSaveProfile();

  // Reset edit mode when save is successful
  React.useEffect(() => {
    if (isSuccess) {
      profileMeStore.getState().actions.setEditMode(false);
      profileMeStore.getState().actions.reset();
    }
  }, [isSuccess, profileMeStore]);

  const handleDoneEditProfile = useCallback(async () => {
    // Get all the profile data from the store
    const newNameTextValue = profileMeStore.getState().nameTextValue;
    const newAvatarUri = profileMeStore.getState().avatarUri;
    const newUsernameTextValue = profileMeStore.getState().usernameTextValue;
    const newDescriptionTextValue = profileMeStore.getState().descriptionTextValue;

    // Use the saveProfile function from the hook
    await saveProfile({
      profile: {
        id: profile?.id,
        name: newNameTextValue || profile?.name,
        description: newDescriptionTextValue || profile?.description || '',
        username: newUsernameTextValue || profile?.username || '',
        avatar: newAvatarUri || profile?.avatar || '',
      },
      inboxId,
    });
  }, [profileMeStore, profile, inboxId, saveProfile]);

  return (
    <Button
      text={translate("Done")}
      variant="text"
      onPress={handleDoneEditProfile}
      loading={isSaving}
    />
  );
});

const $headerRightContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  columnGap: spacing.xxs,
});

const $dropdownMenu: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.sm,
  paddingRight: spacing.xxxs,
});
