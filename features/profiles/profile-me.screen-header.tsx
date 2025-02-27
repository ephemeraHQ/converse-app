import { InboxId } from "@xmtp/react-native-sdk";
import React, { memo, useCallback } from "react";
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
import { logger } from "@/utils/logger";
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
  const { saveProfile, isSaving, isSuccess, error, isError } = useSaveProfile();

  // Reset edit mode when save is successful
  React.useEffect(() => {
    if (isSuccess) {
      profileMeStore.getState().actions.setEditMode(false);
      profileMeStore.getState().actions.reset();
    }
  }, [isSuccess, profileMeStore]);

  // Display toast when there's an error
  React.useEffect(() => {
    if (isError && error) {
      // Extract error message from the API response
      const apiError = error as any;
      
      try {
        // Check if we have a response with error data
        if (apiError.response?.data) {
          const statusCode = apiError.response.status;
          
          // Handle validation errors (400 Bad Request or 409 Conflict)
          if (statusCode === 400 || statusCode === 409) {
            logger.debug("[DoneAction] Validation error response", { 
              statusCode,
              responseData: apiError.response?.data 
            });
            
            // Generic approach to extract validation error messages
            if (apiError.response?.data?.errors) {
              const errors = apiError.response.data.errors;
              
              // Find the first error with a message
              for (const field in errors) {
                if (errors[field]?.message) {
                  const errorMessage = errors[field].message;
                  logger.debug("[DoneAction] Validation error", { field, errorMessage });
                  captureErrorWithToast(error, { message: errorMessage });
                  return;
                }
              }
            }
            
            // Fallback to the general message if we couldn't extract specific error
            const backendMessage = apiError.response?.data?.message || `Error ${statusCode}`;
            captureErrorWithToast(error, { message: backendMessage });
            return;
          }
        }
        
        // For other errors, use the default error handling
        captureErrorWithToast(error);
      } catch (handlingError) {
        // If anything goes wrong in our error handling, still show a toast
        logger.error("[DoneAction] Error while handling error", { handlingError });
        captureErrorWithToast(error);
      }
    }
  }, [isError, error]);

  const handleDoneEditProfile = useCallback(async () => {
    try {
      // Get all the profile data from the store
      const state = profileMeStore.getState();
      
      logger.debug("[DoneAction] Starting profile save", {
        inboxId,
        hasProfile: !!profile,
        profileId: profile?.id,
        xmtpId: profile?.xmtpId,
        storeState: JSON.stringify(state)
      });
      
      // This ensures we're sending the actual values from the form
      const profileUpdate = {
        id: profile?.id,
        xmtpId: inboxId,
        name: state.nameTextValue,
        username: state.usernameTextValue,
        description: state.descriptionTextValue,
        avatar: state.avatarUri,
      };
      
      logger.debug("[DoneAction] Saving profile with update", {
        profileUpdate: JSON.stringify(profileUpdate),
        fields: Object.keys(profileUpdate)
      });
      
      // Use the saveProfile function from the hook
      await saveProfile({
        profile: profileUpdate,
        inboxId,
      });
    } catch (err) {
      logger.error("[DoneAction] Error saving profile", { error: err });
      // Error will be handled by the useMutation onError callback
    }
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
