import { translate } from "@i18n";
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
import React, { useCallback, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

import OnboardingComponent from "./OnboardingComponent";
import config from "../../config";
import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
import {
  useCurrentAccount,
  useProfilesStore,
} from "../../data/store/accountsStore";
import { NavigationParamList } from "../../screens/Navigation/Navigation";
import { checkUsernameValid, claimProfile } from "../../utils/api";
import { uploadFile } from "../../utils/attachment";
import { executeAfterKeyboardClosed } from "../../utils/keyboard";
import { useLogoutFromConverse } from "../../utils/logout";
import {
  compressAndResizeImage,
  pickMediaFromLibrary,
  takePictureFromCamera,
} from "../../utils/media";
import { useLoopTxt } from "../../utils/str";
import Avatar from "../Avatar";
import Button from "../Button/Button";
import { showActionSheetWithOptions } from "../StateHandlers/ActionSheetStateHandler";

export type ProfileType = {
  avatar?: string;
  username: string;
  displayName?: string;
};

type OwnProps = {
  onboarding?: boolean;
};
type NavProps = NativeStackScreenProps<NavigationParamList, "UserProfile">;

type Props = OwnProps & Partial<NavProps>;

const LOADING_SENTENCES = Object.values(
  translate("userProfile.loadingSentences")
);

export const UserProfile = ({ onboarding, navigation }: Props) => {
  const address = useCurrentAccount() as string;
  const profiles = useProfilesStore((state) => state.profiles);
  const currentUserUsername = getProfile(
    address,
    profiles
  )?.socials?.userNames?.find((u) => u.isPrimary);

  const [errorMessage, setErrorMessage] = useState("");
  const colorScheme = useColorScheme();
  const styles = useStyles(colorScheme, errorMessage);

  const [profile, setProfile] = useState({
    username:
      currentUserUsername?.name?.replace(config.usernameSuffix, "") || "",
    avatar: currentUserUsername?.avatar || "",
    displayName: currentUserUsername?.displayName || "",
  } as ProfileType);
  const [loading, setLoading] = useState(false);
  const logout = useLogoutFromConverse(address);

  const loadingSubtitle = useLoopTxt(2000, LOADING_SENTENCES, loading, false);

  const handleContinue = useCallback(async () => {
    if (
      profile.displayName &&
      profile.displayName.length > 0 &&
      (profile.displayName.length < 3 || profile.displayName.length > 32)
    ) {
      setErrorMessage(translate("userProfile.errors.displayNameLength"));
      return;
    }

    // Allow only alphanumeric and limit to 30 chars
    if (!/^[a-zA-Z0-9]*$/.test(profile.username)) {
      setErrorMessage(translate("userProfile.errors.usernameAlphanumeric"));
      return;
    }
    // Only allow usernames between 3-30 characters long
    if (profile.username.length < 3 || profile.username.length > 30) {
      setErrorMessage(translate("userProfile.errors.usernameLength"));
      return;
    }

    setLoading(true);

    // First check username availability
    try {
      await checkUsernameValid(address, profile.username);
    } catch (e: any) {
      logger.error(e, { context: "UserProfile: Checking username valid" });
      setLoading(false);
      setErrorMessage(e?.response?.data?.message || "An unknown error occured");
      return;
    }

    let publicAvatar = "";
    if (profile.avatar) {
      if (profile.avatar.startsWith("https://")) {
        publicAvatar = profile.avatar;
      } else {
        // Let's upload the image to our server
        const resizedImage = await compressAndResizeImage(profile.avatar, true);

        try {
          // On web we use blob, on mobile we use file path
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
            e?.response?.data?.message || "An unknown error occured"
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
      setErrorMessage(e?.response?.data?.message || "An unknown error occured");
      setLoading(false);
      return;
    }
    if (!onboarding && navigation) {
      navigation.goBack();
    }
  }, [address, navigation, onboarding, profile]);

  const pickMedia = useCallback(async () => {
    const asset = await pickMediaFromLibrary({
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!asset) return;
    setProfile({ ...profile, avatar: asset.uri });
  }, [profile, setProfile]);

  const openCamera = useCallback(async () => {
    const asset = await takePictureFromCamera({
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!asset) return;
    setProfile({ ...profile, avatar: asset.uri });
  }, [profile, setProfile]);

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

  const usernameRef = useRef<TextInput>();

  return (
    <OnboardingComponent
      title={translate("userProfile.title.profile")}
      primaryButtonText={translate("userProfile.buttons.continue")}
      primaryButtonAction={handleContinue}
      backButtonText={
        onboarding ? translate("userProfile.buttons.cancel") : undefined
      }
      backButtonAction={onboarding ? () => logout(false) : undefined}
      isLoading={loading}
      loadingSubtitle={loadingSubtitle}
      shrinkWithKeyboard
      inNav={!onboarding}
    >
      <Avatar
        uri={profile?.avatar}
        style={styles.avatar}
        name={profile.displayName || profile.username}
      />
      <Button
        variant="text"
        title={
          profile?.avatar
            ? translate("userProfile.buttons.changeProfilePicture")
            : translate("userProfile.buttons.addProfilePicture")
        }
        textStyle={{ fontWeight: "500" }}
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
      <Text style={styles.p}>
        {errorMessage || translate("userProfile.converseProfiles")}
      </Text>
    </OnboardingComponent>
  );
};

const useStyles = (colorScheme: any, errorMessage: any) =>
  StyleSheet.create({
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

export default UserProfile;
