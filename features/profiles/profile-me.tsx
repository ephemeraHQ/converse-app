import { InboxId } from "@xmtp/react-native-sdk";
import React, { memo, useCallback, useEffect, useState } from "react";
import { Screen } from "@/components/screen/screen";
import { SettingsList } from "@/design-system/settings-list/settings-list";
import { useLogout } from "@/features/authentication/use-logout.hook";
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

export function ProfileMe(props: { inboxId: InboxId }) {
  const { inboxId } = props;

  const { theme } = useAppTheme();

  const router = useRouter();

  const { logout } = useLogout();

  const editMode = useProfileMeStoreValue(inboxId, (state) => state.editMode);

  const isMyProfile = useCurrentSender()?.inboxId === inboxId;

  const { data: profile } = useProfileQuery({ xmtpId: inboxId });

  const { data: socialProfiles } = useSocialProfilesForAddressQuery({
    ethAddress: profile?.privyAddress,
  });

  useProfileMeScreenHeader({ inboxId });

  return (
    <Screen preset="fixed" backgroundColor={theme.colors.background.surface}>
      <ProfileSection>
        {editMode ? (
          <ProfileContactCardLayout
            avatar={<EditableProfileContactCardAvatar inboxId={inboxId} />}
            name={<EditableProfileContactCardNameInput inboxId={inboxId} />}
          />
        ) : (
          <ProfileContactCard inboxId={inboxId} />
        )}
      </ProfileSection>

      {socialProfiles && (
        <ProfileSocialsNames socialProfiles={socialProfiles} />
      )}

      {isMyProfile && (
        <ProfileSection withTopBorder>
          <SettingsList
            rows={[
              {
                label: translate("userProfile.settings.archive"),
                onPress: () => {
                  router.navigate("Blocked");
                },
              },
              /*{
                  label: translate("userProfile.settings.keep_messages"),
                  value: "Forever",
                  onValueChange: () => {},
                },*/
              {
                label: translate("log_out"),
                isWarning: true,
                onPress: () => {
                  logout();
                },
              },
            ]}
          />
        </ProfileSection>
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

const EditableProfileContactCardAvatar = memo(
  function EditableProfileContactCardAvatar({ inboxId }: { inboxId: InboxId }) {
    const { asset, addPFP } = useAddPfp();

    const profileMeStore = useProfileMeStore(inboxId);

    const { data: profile } = useProfileQuery({ xmtpId: inboxId });

    useEffect(() => {
      if (asset?.uri && asset.uri !== profileMeStore.getState().avatarUri) {
        profileMeStore.getState().actions.setAvatarUri(asset.uri);
      }
    }, [asset?.uri, profileMeStore]);

    return (
      <ProfileContactCardEditableAvatar
        avatarUri={asset?.uri ?? profile?.avatar}
        avatarName={profile?.name}
        onPress={addPFP}
      />
    );
  },
);
