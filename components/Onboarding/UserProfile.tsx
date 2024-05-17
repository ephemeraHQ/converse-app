import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  useColorScheme,
  Platform,
} from "react-native";

import config from "../../config";
import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
import {
  useCurrentAccount,
  useProfilesStore,
  useSettingsStore,
} from "../../data/store/accountsStore";
import { NavigationParamList } from "../../screens/Navigation/Navigation";
import { checkUsernameValid, claimProfile } from "../../utils/api";
import { uploadFile } from "../../utils/attachment";
import {
  textPrimaryColor,
  textSecondaryColor,
  dangerColor,
  actionSheetColors,
  itemSeparatorColor,
} from "../../utils/colors";
import { executeAfterKeyboardClosed } from "../../utils/keyboard";
import { useLogoutFromConverse } from "../../utils/logout";
import {
  compressAndResizeImage,
  pickMediaFromLibrary,
  takePictureFromCamera,
} from "../../utils/media";
import Avatar from "../Avatar";
import Button from "../Button/Button";
import { showActionSheetWithOptions } from "../StateHandlers/ActionSheetStateHandler";
import OnboardingComponent from "./OnboardingComponent";

export type ProfileType = {
  avatar: string;
  username: string;
  displayName: string;
};

type OwnProps = {
  onboarding?: boolean;
};
type NavProps = NativeStackScreenProps<NavigationParamList, "UserProfile">;

type Props = OwnProps & Partial<NavProps>;

export const UserProfile = ({ onboarding, navigation }: Props) => {
  const address = useCurrentAccount() as string;
  const profiles = useProfilesStore((state) => state.profiles);
  const onboardedAfterProfilesRelease = useSettingsStore(
    (s) => s.onboardedAfterProfilesRelease
  );
  const currentUserUsername = profiles[address]?.socials?.userNames?.find(
    (u) => u.isPrimary
  );

  const shouldShowIntermediaryScreen =
    onboarding && !onboardedAfterProfilesRelease;

  const [intermediaryScreenShown, setIntermediaryScreenShown] = useState(
    shouldShowIntermediaryScreen
  );

  useEffect(() => {
    setIntermediaryScreenShown(shouldShowIntermediaryScreen);
  }, [shouldShowIntermediaryScreen]);

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

  const handleContinue = useCallback(async () => {
    if (intermediaryScreenShown) {
      setIntermediaryScreenShown(false);
      return;
    }
    if (!profile.avatar) {
      setErrorMessage("You must define an avatar");
      return;
    }

    if (profile.displayName.length < 3 || profile.displayName.length > 32) {
      setErrorMessage(
        "Your user name must be between 3 and 32 characters long"
      );
      return;
    }

    // Allow only alphanumeric and limit to 30 chars
    if (!/^[a-zA-Z0-9]*$/.test(profile.username)) {
      setErrorMessage("Your username can only contain letters and numbers");
      return;
    }
    // Only allow usernames between 3-30 characters long
    if (profile.username.length < 3 || profile.username.length > 30) {
      setErrorMessage(
        "Your user name must be between 3 and 30 characters long"
      );
      return;
    }

    setLoading(true);

    // First check username availability
    try {
      await checkUsernameValid(address, profile.username);
    } catch (e: any) {
      setLoading(false);
      setErrorMessage(e?.response?.data?.message || "An unknown error occured");
      return;
    }

    let publicAvatar = "";
    if (profile.avatar.startsWith("https://")) {
      publicAvatar = profile.avatar;
    } else {
      // Let's upload the image to our server
      const resizedImage = await compressAndResizeImage(profile.avatar);

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
        setErrorMessage(
          e?.response?.data?.message || "An unknown error occured"
        );
        setLoading(false);
        return;
      }
    }

    try {
      await claimProfile({
        account: address,
        profile: { ...profile, avatar: publicAvatar },
      });
      await refreshProfileForAddress(address, address);
    } catch (e: any) {
      setErrorMessage(e?.response?.data?.message || "An unknown error occured");
      setLoading(false);
      return;
    }
    if (!onboarding && navigation) {
      navigation.goBack();
    }
  }, [address, navigation, onboarding, profile, intermediaryScreenShown]);

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
          options: ["Take photo", "Chose from library", "Cancel"],
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

  return (
    <OnboardingComponent
      title={
        intermediaryScreenShown ? "Introducing\nConverse Profiles" : "Profile"
      }
      primaryButtonText="Continue"
      primaryButtonAction={handleContinue}
      backButtonText={
        onboarding && !intermediaryScreenShown
          ? shouldShowIntermediaryScreen
            ? "Logout"
            : "Back to home screen"
          : undefined
      }
      backButtonAction={onboarding ? logout : undefined}
      isLoading={loading}
      shrinkWithKeyboard
      inNav={!onboarding}
    >
      <Avatar
        key={`avatar-${intermediaryScreenShown}`}
        uri={profile?.avatar}
        style={styles.avatar}
        color={intermediaryScreenShown}
      />
      {intermediaryScreenShown && (
        <>
          <Text style={styles.converseProfiles}>
            Converse Profiles are free and compatible with ENS. Select a profile
            picture, a username and a display name and enjoy a more intimate
            Converse experience.
          </Text>
        </>
      )}
      {!intermediaryScreenShown && (
        <>
          <Button
            variant="text"
            title={
              profile?.avatar ? "Change profile picture" : "Add profile picture"
            }
            textStyle={{ fontWeight: "500" }}
            onPress={addPFP}
          />
          <View style={styles.usernameInputContainer}>
            <TextInput
              style={[styles.profileInput]}
              onChangeText={(text) => {
                // Limit the display name to 50 characters
                const trimmedDisplayName = text.slice(0, 50);
                setProfile({ ...profile, displayName: trimmedDisplayName });
              }}
              value={profile.displayName}
              placeholder="Display Name"
              placeholderTextColor={textSecondaryColor(colorScheme)}
              autoCapitalize="words"
              onSubmitEditing={handleContinue}
              enterKeyHint="done"
              returnKeyType="done"
              maxLength={30}
              autoCorrect={false}
              autoComplete="off"
            />
            <TextInput
              style={[styles.profileInput, styles.usernameInput]}
              onChangeText={(text) => {
                // Limit the username to 30 characters
                const trimmedUsername = text.slice(0, 30);
                setProfile({ ...profile, username: trimmedUsername });
              }}
              value={profile.username}
              placeholder="username"
              placeholderTextColor={textSecondaryColor(colorScheme)}
              autoCapitalize="none"
              onSubmitEditing={handleContinue}
              enterKeyHint="done"
              returnKeyType="done"
              maxLength={30}
              autoCorrect={false}
              autoComplete="off"
            />
            <Text style={styles.p}>
              {errorMessage ||
                "Pick a photo, a display name and a unique username."}
            </Text>
          </View>
        </>
      )}
    </OnboardingComponent>
  );
};

const useStyles = (colorScheme: any, errorMessage: any) =>
  StyleSheet.create({
    avatar: {
      marginBottom: 10,
      marginTop: 23,
    },
    converseProfiles: {
      textAlign: "center",
      fontSize: 17,
      marginTop: 23,
      paddingHorizontal: 32,
    },
    usernameInputContainer: {
      width: "100%",
      paddingLeft: 16,
      marginTop: 23,
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: itemSeparatorColor(colorScheme),
    },
    profileInput: {
      alignContent: "flex-start",
      color: textPrimaryColor(colorScheme),
      paddingRight: 16,
      paddingTop: 10,
      paddingBottom: 10,
      fontSize: 17,
      width: "100%",
    },
    usernameInput: {
      borderTopWidth: 1,
      borderTopColor: itemSeparatorColor(colorScheme),
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
            : textPrimaryColor(colorScheme),
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
