import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { SettingsList } from "@/design-system/settings-list/settings-list";
import { useAddPfp } from "@/features/onboarding/hooks/useAddPfp";
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
import { validateProfileName } from "@/features/profiles/utils/validate-profile-name";
import { useSafeCurrentAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import { usePreferredInboxAvatar } from "@/hooks/usePreferredInboxAvatar";
import { usePreferredInboxName } from "@/hooks/usePreferredInboxName";
import { translate } from "@/i18n";
import { useInboxProfileSocialsQuery } from "@/queries/useInboxProfileSocialsQuery";
import { useAppTheme } from "@/theme/useAppTheme";
import { useLogout } from "@/utils/logout";
import { useRouter } from "@navigation/useNavigation";
import { InboxId } from "@xmtp/react-native-sdk";
import React, { memo, useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

export function ProfileMe(props: { inboxId: InboxId }) {
  const { inboxId } = props;

  const { theme } = useAppTheme();

  const router = useRouter();

  const { logout } = useLogout();

  const editMode = useProfileMeStoreValue(inboxId, (state) => state.editMode);

  const currentAccountInboxId = useSafeCurrentAccountInboxId();

  const isMyProfile = currentAccountInboxId === inboxId;

  const { data: socials } = useInboxProfileSocialsQuery({
    inboxId,
    caller: "ProfileMe",
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

      {socials && <ProfileSocialsNames socials={socials[0]} />}

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
                onPress: () => logout(),
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
      [profileMeStore]
    );

    return (
      <ProfileContactCardEditableNameInput
        defaultValue={nameDefaultTextValue}
        onChangeText={handleDisplayNameChange}
        status={nameValidationError ? "error" : undefined}
        helper={nameValidationError}
      />
    );
  }
);

const EditableProfileContactCardAvatar = memo(
  function EditableProfileContactCardAvatar({ inboxId }: { inboxId: InboxId }) {
    const { asset, addPFP } = useAddPfp();

    const profileMeStore = useProfileMeStore(inboxId);

    const { data: currentAvatarName } = usePreferredInboxName({
      inboxId,
    });

    const { data: currentAvatarUri } = usePreferredInboxAvatar({
      inboxId,
    });

    useEffect(() => {
      if (asset?.uri && asset.uri !== profileMeStore.getState().avatarUri) {
        profileMeStore.getState().actions.setAvatarUri(asset.uri);
      }
    }, [asset?.uri, profileMeStore]);

    return (
      <ProfileContactCardEditableAvatar
        avatarUri={asset?.uri ?? currentAvatarUri}
        avatarName={currentAvatarName}
        onPress={addPFP}
      />
    );
  }
);
