import { InboxId } from "@xmtp/react-native-sdk";
import React, { memo, useCallback, useEffect, useState } from "react";
import { Screen } from "@/components/screen/screen";
import { SettingsList } from "@/design-system/settings-list/settings-list";
import { useLogout } from "@/features/authentication/use-logout";
import { ProfileContactCard } from "@/features/profiles/components/profile-contact-card/profile-contact-card";
import { ProfileContactCardEditableAvatar } from "@/features/profiles/components/profile-contact-card/profile-contact-card-editable-avatar";
import { ProfileContactCardEditableNameInput } from "@/features/profiles/components/profile-contact-card/profile-contact-card-editable-name-input";
import { ProfileContactCardLayout } from "@/features/profiles/components/profile-contact-card/profile-contact-card-layout";
import { ProfileSection } from "@/features/profiles/components/profile-section";
import { ProfileSocialsNames } from "@/features/profiles/components/profile-social-names";
import { useProfileMeScreenHeader } from "@/features/profiles/profile-me.screen-header";
import {
  useProfileMeStore,
  useProfileMeStoreValue,
} from "@/features/profiles/profile-me.store";
import { useProfileQuery } from "@/features/profiles/profiles.query";
import { validateProfileName } from "@/features/profiles/utils/validate-profile-name";
import { useSocialProfilesForAddressQuery } from "@/features/social-profiles/social-profiles.query";
import { useAddPfp } from "@/hooks/use-add-pfp";
import { translate } from "@/i18n";
import { useRouter } from "@/navigation/use-navigation";
import { useAppTheme } from "@/theme/use-app-theme";
import { useCurrentSender } from "../authentication/multi-inbox.store";
import { TextField } from "@/design-system/TextField/TextField";
import { VStack } from "@/design-system/VStack";
import { Text } from "@/design-system/Text";
import { captureErrorWithToast } from "@/utils/capture-error";

export function ProfileMe(props: { inboxId: InboxId }) {
  const { inboxId } = props;

  const { theme } = useAppTheme();

  const router = useRouter();

  const { logout } = useLogout();

  // Get the edit mode state from the store
  const editMode = useProfileMeStoreValue(inboxId, (state) => state.editMode);

  const isMyProfile = useCurrentSender()?.inboxId === inboxId;

  const { data: profile } = useProfileQuery({ xmtpId: inboxId });

  const { data: socialProfiles } = useSocialProfilesForAddressQuery({
    ethAddress: profile?.privyAddress,
  });

  // Set up the screen header with edit functionality
  useProfileMeScreenHeader({ inboxId });

  return (
    <Screen preset="fixed" backgroundColor={theme.colors.background.surface}>
      <ProfileSection>
        {/* Show editable avatar and name when in edit mode */}
        {editMode ? (
          <ProfileContactCardLayout
            avatar={<EditableProfileContactCardAvatar inboxId={inboxId} />}
            name={<EditableProfileContactCardNameInput inboxId={inboxId} />}
          />
        ) : (
          <ProfileContactCard inboxId={inboxId} />
        )}
      </ProfileSection>

      {/* Show different content based on edit mode */}
      {editMode ? (
        // In edit mode, show username and description input fields
        <ProfileSection withTopBorder>
          <VStack style={{ rowGap: theme.spacing.md }}>
            <EditableUsernameInput inboxId={inboxId} />
            <EditableDescriptionInput inboxId={inboxId} />
          </VStack>
        </ProfileSection>
      ) : (
        // In view mode, show profile info and settings
        <>
          {/* Show username and description if they exist */}
          {profile?.username || profile?.description ? (
            <ProfileSection withTopBorder>
              <VStack style={{ rowGap: theme.spacing.md }}>
                {profile.username && (
                  <VStack style={{ rowGap: theme.spacing.xxs }}>
                    <Text preset="formLabel">
                      {translate("Username")}
                    </Text>
                    <Text preset="body">{profile.username}</Text>
                  </VStack>
                )}
                {profile?.description && (
                  <VStack style={{ rowGap: theme.spacing.xxs }}>
                    <Text preset="formLabel">
                      {translate("About")}
                    </Text>
                    <Text preset="body">{profile.description}</Text>
                  </VStack>
                )}
              </VStack>
            </ProfileSection>
          ) : null}

          {socialProfiles && (
            <ProfileSocialsNames socialProfiles={socialProfiles} />
          )}

          {/* Only show settings when viewing your own profile and not in edit mode */}
          {isMyProfile && !editMode && (
            <ProfileSection withTopBorder>
              <SettingsList
                rows={[
                  {
                    label: translate("Archive"),
                    onPress: () => {
                      router.navigate("Blocked");
                    },
                  },
                  /*{
                      label: translate("Keep messages"),
                      value: "Forever",
                      onValueChange: () => {},
                    },*/
                  {
                    label: translate("Log out"),
                    isWarning: true,
                    onPress: () => {
                      logout();
                    },
                  },
                ]}
              />
            </ProfileSection>
          )}
        </>
      )}
    </Screen>
  );
}

const EditableProfileContactCardNameInput = memo(
  function EditableProfileContactCardNameInput({
    inboxId,
  }: {
    inboxId: InboxId;
  }) {
    const profileMeStore = useProfileMeStore(inboxId);

    const nameDefaultTextValue = profileMeStore.getState().nameTextValue;

    const [nameValidationError, setNameValidationError] = useState<string>();

    const handleDisplayNameChange = useCallback(
      (text: string) => {
        const { isValid, error } = validateProfileName(text);

        if (!isValid) {
          setNameValidationError(error);
        } else {
          setNameValidationError(undefined);
        }

        profileMeStore.getState().actions.setNameTextValue(text);
      },
      [profileMeStore],
    );

    return (
      <ProfileContactCardEditableNameInput
        defaultValue={nameDefaultTextValue}
        onChangeText={handleDisplayNameChange}
        status={nameValidationError ? "error" : undefined}
        helper={nameValidationError}
      />
    );
  },
);

const EditableUsernameInput = memo(
  function EditableUsernameInput({
    inboxId,
  }: {
    inboxId: InboxId;
  }) {
    const { theme } = useAppTheme();
    const profileMeStore = useProfileMeStore(inboxId);
    const { data: profile } = useProfileQuery({ xmtpId: inboxId });
    
    const usernameDefaultTextValue = profileMeStore.getState().usernameTextValue || profile?.username || '';
    
    useEffect(() => {
      if (profile?.username && !profileMeStore.getState().usernameTextValue) {
        profileMeStore.getState().actions.setUsernameTextValue(profile.username);
      }
    }, [profile?.username, profileMeStore]);

    const handleUsernameChange = useCallback(
      (text: string) => {
        profileMeStore.getState().actions.setUsernameTextValue(text);
      },
      [profileMeStore],
    );

    return (
      <VStack style={{ rowGap: theme.spacing.xxs }}>
        <TextField
          label="convos.xyz/"
          defaultValue={usernameDefaultTextValue}
          onChangeText={handleUsernameChange}
          helper={translate("Your unique sharable link")}
        />
      </VStack>
    );
  },
);

const EditableDescriptionInput = memo(
  function EditableDescriptionInput({
    inboxId,
  }: {
    inboxId: InboxId;
  }) {
    const { theme } = useAppTheme();
    const profileMeStore = useProfileMeStore(inboxId);
    const { data: profile } = useProfileQuery({ xmtpId: inboxId });
    
    const descriptionDefaultTextValue = profileMeStore.getState().descriptionTextValue || profile?.description || '';
    
    useEffect(() => {
      if (profile?.description && !profileMeStore.getState().descriptionTextValue) {
        profileMeStore.getState().actions.setDescriptionTextValue(profile.description);
      }
    }, [profile?.description, profileMeStore]);

    const handleDescriptionChange = useCallback(
      (text: string) => {
        profileMeStore.getState().actions.setDescriptionTextValue(text);
      },
      [profileMeStore],
    );

    return (
      <VStack style={{ rowGap: theme.spacing.xxs }}>
        <TextField
          defaultValue={descriptionDefaultTextValue}
          onChangeText={handleDescriptionChange}
          multiline
          numberOfLines={3}
          label={translate("About")}
        />
      </VStack>
    );
  },
);

const EditableProfileContactCardAvatar = memo(
  function EditableProfileContactCardAvatar({ inboxId }: { inboxId: InboxId }) {
    const { addPFP, asset, isUploading } = useAddPfp();
    const profileMeStore = useProfileMeStore(inboxId);
    const { data: profile } = useProfileQuery({ xmtpId: inboxId });
    
    // Determine which avatar to display with priority: store avatar > profile avatar
    const storeAvatar = profileMeStore.getState().avatarUri;
    const profileAvatar = profile?.avatar;
    
    // Create a display URI with a cache-busting parameter
    const getDisplayUri = useCallback(() => {
      // Priority: local asset (during upload) > store avatar > profile avatar
      const sourceUri = asset?.uri || storeAvatar || profileAvatar;
      
      if (!sourceUri) {
        return undefined;
      }
      
      return sourceUri;
    }, [asset?.uri, storeAvatar, profileAvatar]);

    // Update upload status
    useEffect(() => {
      profileMeStore.getState().actions.setIsAvatarUploading(isUploading);
    }, [isUploading, profileMeStore]);

    const addAvatar = useCallback(async () => {
      try {
        const uploadedUrl = await addPFP();
        if (uploadedUrl) {
          profileMeStore.getState().actions.setAvatarUri(uploadedUrl);
        }
      } catch (error) {
        captureErrorWithToast(error, {
          message: "Failed to upload avatar. Please try again.",
        });
      }
    }, [addPFP, profileMeStore]);

    return (
      <ProfileContactCardEditableAvatar
        avatarUri={getDisplayUri()}
        avatarName={profile?.name}
        onPress={addAvatar}
      />
    );
  },
);
