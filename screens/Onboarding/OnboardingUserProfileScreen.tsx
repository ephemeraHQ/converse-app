import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  actionSheetColors,
  dangerColor,
  itemSeparatorColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import logger from "@utils/logger";
import { getProfile } from "@utils/profile";
import { ImagePickerAsset } from "expo-image-picker";
import React, { useCallback, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

import Avatar from "../../components/Avatar";
import Button from "../../components/Button/Button";
import { OnboardingPictoTitleSubtitle } from "../../components/Onboarding/OnboardingPictoTitleSubtitle";
import { OnboardingPrimaryCtaButton } from "../../components/Onboarding/OnboardingPrimaryCtaButton";
import { OnboardingScreen } from "../../components/Onboarding/OnboardingScreen";
import { showActionSheetWithOptions } from "../../components/StateHandlers/ActionSheetStateHandler";
import config from "../../config";
import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
import {
  getCurrentAccount,
  useCurrentAccount,
  useProfilesStore,
  useSettingsStore,
} from "../../data/store/accountsStore";
import { useSelect } from "../../data/store/storeHelpers";
import { VStack } from "../../design-system/VStack";
import { translate } from "../../i18n";
import { spacing } from "../../theme";
import { checkUsernameValid, claimProfile } from "../../utils/api";
import { uploadFile } from "../../utils/attachment";
import { executeAfterKeyboardClosed } from "../../utils/keyboard";
import {
  compressAndResizeImage,
  pickMediaFromLibrary,
  takePictureFromCamera,
} from "../../utils/media";
import { sentryTrackError } from "../../utils/sentry";
import {
  formatEphemeralDisplayName,
  formatEphemeralUsername,
} from "../../utils/str";
import { NavigationParamList } from "../Navigation/Navigation";

export type ProfileType = {
  avatar?: string;
  username: string;
  displayName?: string;
};

export const OnboardingUserProfileScreen = (
  props: NativeStackScreenProps<NavigationParamList, "OnboardingUserProfile">
) => {
  const { navigation } = props;

  const colorScheme = useColorScheme();

  const { profile, setProfile } = useProfile();

  const { createOrUpdateProfile, loading, errorMessage } =
    useCreateOrUpdateProfileInfo();

  const styles = useUserProfileStyles(colorScheme, errorMessage);

  const handleContinue = useCallback(async () => {
    try {
      await createOrUpdateProfile({ profile });
      navigation.push("OnboardingNotifications");
    } catch (error) {
      sentryTrackError(error);
    }
  }, [createOrUpdateProfile, profile, navigation]);

  const usernameRef = useRef<TextInput>();

  const { addPFP, asset } = useAddPfp();

  return (
    <OnboardingScreen contentContainerStyle={{ alignItems: "center" }}>
      <OnboardingPictoTitleSubtitle.All
        title={translate("userProfile.title.profile")}
      />

      <Pressable onPress={addPFP}>
        <Avatar
          uri={profile?.avatar || asset?.uri}
          style={styles.avatar}
          name={profile.displayName || profile.username}
        />
      </Pressable>

      <Button
        variant="text"
        title={
          profile?.avatar
            ? translate("userProfile.buttons.changeProfilePicture")
            : translate("userProfile.buttons.addProfilePicture")
        }
        onPress={addPFP}
      />

      <View style={styles.usernameInputContainer}>
        <TextInput
          style={styles.profileInput}
          onChangeText={(text) => {
            const trimmedUsername = text.slice(0, 30);
            setProfile({ ...profile, username: trimmedUsername });
          }}
          ref={(r) => {
            if (r) {
              usernameRef.current = r;
            }
          }}
          value={profile.username}
          placeholder={translate("userProfile.inputs.username.placeholder")}
          placeholderTextColor={textSecondaryColor(colorScheme)}
          autoCapitalize="none"
          enterKeyHint="done"
          returnKeyType="done"
          maxLength={30}
          autoCorrect={false}
          autoComplete="off"
        />
        <Text style={styles.usernameSuffixLabel}>
          {translate("userProfile.inputs.usernameSuffix")}
        </Text>
        <TextInput
          style={[styles.profileInput, styles.displayNameInput]}
          onChangeText={(text) => {
            const trimmedDisplayName = text.slice(0, 50);
            setProfile({ ...profile, displayName: trimmedDisplayName });
          }}
          value={profile.displayName}
          placeholder={translate("userProfile.inputs.displayName.placeholder")}
          placeholderTextColor={textSecondaryColor(colorScheme)}
          autoCapitalize="words"
          onSubmitEditing={() => {
            usernameRef.current?.focus();
          }}
          enterKeyHint="next"
          maxLength={30}
          autoCorrect={false}
          autoComplete="off"
        />
      </View>

      <VStack
        style={{
          rowGap: spacing.sm,
        }}
      >
        <Text style={styles.p}>
          {errorMessage || translate("userProfile.converseProfiles")}
        </Text>
        <OnboardingPrimaryCtaButton
          title={translate("userProfile.buttons.continue")}
          onPress={handleContinue}
          loading={loading}
        />
      </VStack>
    </OnboardingScreen>
  );
};

export function useProfile() {
  const address = useCurrentAccount()!; // We assume if someone goes to this screen we have address

  const profiles = useProfilesStore((state) => state.profiles);

  const currentUserUsername = getProfile(
    address,
    profiles
  )?.socials?.userNames?.find((u) => u.isPrimary);

  const { ephemeralAccount } = useSettingsStore(
    useSelect(["ephemeralAccount"])
  );

  const usernameWithoutSuffix = currentUserUsername?.name?.replace(
    config.usernameSuffix,
    ""
  );

  const defaultEphemeralUsername = formatEphemeralUsername(
    address,
    usernameWithoutSuffix
  );
  const defaultEphemeralDisplayName = formatEphemeralDisplayName(
    address,
    currentUserUsername?.displayName
  );

  const [profile, setProfile] = useState<ProfileType>({
    username: ephemeralAccount
      ? defaultEphemeralUsername
      : usernameWithoutSuffix || "",
    avatar: currentUserUsername?.avatar || "",
    displayName: ephemeralAccount
      ? defaultEphemeralDisplayName
      : currentUserUsername?.displayName || "",
  });

  return { profile, setProfile };
}

export function useAddPfp() {
  const [asset, setAsset] = useState<ImagePickerAsset>();

  const colorScheme = useColorScheme();

  const pickMedia = useCallback(async () => {
    const asset = await pickMediaFromLibrary({
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!asset) return;
    setAsset(asset);
  }, []);

  const openCamera = useCallback(async () => {
    const asset = await takePictureFromCamera({
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!asset) return;
    setAsset(asset);
  }, []);

  const addPFP = useCallback(() => {
    const showOptions = () =>
      showActionSheetWithOptions(
        {
          options: [
            translate("userProfile.mediaOptions.takePhoto"),
            translate("userProfile.mediaOptions.chooseFromLibrary"),
            translate("userProfile.mediaOptions.cancel"),
          ],
          cancelButtonIndex: 2,
          ...actionSheetColors(colorScheme),
        },
        async (selectedIndex?: number) => {
          switch (selectedIndex) {
            case 0: // Camera
              openCamera();
              break;
            case 1: // Media Library
              pickMedia();
              break;

            default:
              break;
          }
        }
      );
    if (Platform.OS === "web") {
      pickMedia();
    } else {
      executeAfterKeyboardClosed(showOptions);
    }
  }, [colorScheme, openCamera, pickMedia]);

  return { addPFP, asset };
}

export function useCreateOrUpdateProfileInfo() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const createOrUpdateProfile = useCallback(
    async (args: { profile: ProfileType }) => {
      const { profile } = args;

      const address = getCurrentAccount()!;

      if (
        profile.displayName &&
        profile.displayName.length > 0 &&
        (profile.displayName.length < 3 || profile.displayName.length > 32)
      ) {
        setErrorMessage(translate("userProfile.errors.displayNameLength"));
        return;
      }

      if (!/^[a-zA-Z0-9]*$/.test(profile.username)) {
        setErrorMessage(translate("userProfile.errors.usernameAlphanumeric"));
        return;
      }

      if (profile.username.length < 3 || profile.username.length > 30) {
        setErrorMessage(translate("userProfile.errors.usernameLength"));
        return;
      }

      setLoading(true);

      try {
        await checkUsernameValid(address, profile.username);
      } catch (e: any) {
        logger.error(e, { context: "UserProfile: Checking username valid" });
        setLoading(false);
        setErrorMessage(
          e?.response?.data?.message || "An unknown error occurred"
        );
        return;
      }

      let publicAvatar = "";
      if (profile.avatar) {
        if (profile.avatar.startsWith("https://")) {
          publicAvatar = profile.avatar;
        } else {
          const resizedImage = await compressAndResizeImage(
            profile.avatar,
            true
          );

          try {
            publicAvatar =
              Platform.OS === "web"
                ? await uploadFile({
                    account: address,
                    contentType: "image/jpeg",
                    blob: new Blob(
                      [Buffer.from(resizedImage.base64 as string, "base64")],
                      { type: "image/png" }
                    ),
                  })
                : await uploadFile({
                    account: address,
                    filePath: resizedImage.uri,
                    contentType: "image/jpeg",
                  });
          } catch (e: any) {
            logger.error(e, { context: "UserProfile: uploading profile pic" });
            setErrorMessage(
              e?.response?.data?.message || "An unknown error occurred"
            );
            setLoading(false);
            return;
          }
        }
      }

      try {
        await claimProfile({
          account: address,
          profile: { ...profile, avatar: publicAvatar },
        });
        await refreshProfileForAddress(address, address);
      } catch (e: any) {
        logger.error(e, { context: "UserProfile: claiming and refreshing" });
        setErrorMessage(
          e?.response?.data?.message || "An unknown error occurred"
        );
        setLoading(false);
      }
    },
    [setLoading, setErrorMessage]
  );

  return { createOrUpdateProfile, loading, errorMessage };
}

export const useUserProfileStyles = (colorScheme: any, errorMessage: any) => {
  return StyleSheet.create({
    avatar: {
      marginBottom: 10,
      marginTop: 23,
    },
    usernameInputContainer: {
      width: "100%",
      marginTop: 23,
      alignItems: "center",
      ...Platform.select({
        default: {
          borderTopWidth: 1,
          borderTopColor: itemSeparatorColor(colorScheme),
          borderBottomWidth: 1,
          borderBottomColor: itemSeparatorColor(colorScheme),
        },
        android: { paddingHorizontal: 32 },
      }),
    },
    profileInput: {
      alignContent: "flex-start",
      color: textPrimaryColor(colorScheme),

      paddingTop: 10,
      paddingBottom: 10,
      fontSize: 17,
      width: "100%",
      ...Platform.select({
        default: { paddingHorizontal: 16 },
        android: {
          paddingHorizontal: 16,
          borderWidth: 1,
          borderColor: textSecondaryColor(colorScheme),
          borderRadius: 4,
        },
      }),
    },
    displayNameInput: {
      ...Platform.select({
        default: {
          borderTopWidth: 1,
          borderTopColor: itemSeparatorColor(colorScheme),
        },
        android: {
          marginTop: 21,
        },
      }),
    },
    usernameSuffixLabel: {
      position: "absolute",
      right: Platform.OS === "ios" ? 10 : 46,
      top: 12,
      fontSize: 16,
      color: textSecondaryColor(colorScheme),
      zIndex: 1,
    },
    p: {
      textAlign: "center",
      marginTop: 20,
      marginLeft: 25,
      marginRight: 25,
      ...Platform.select({
        default: {
          fontSize: 17,
          color: errorMessage
            ? dangerColor(colorScheme)
            : textSecondaryColor(colorScheme),
        },
        android: {
          fontSize: 14,
          lineHeight: 20,
          color: errorMessage
            ? dangerColor(colorScheme)
            : textSecondaryColor(colorScheme),
        },
      }),
    },
  });
};
