import { Image } from "expo-image";
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  useColorScheme,
  Platform,
} from "react-native";

import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
import { useCurrentAccount } from "../../data/store/accountsStore";
import { checkUsernameValid, claimProfile } from "../../utils/api";
import { uploadFile } from "../../utils/attachment";
import {
  textInputStyle,
  textPrimaryColor,
  textSecondaryColor,
  dangerColor,
  actionSheetColors,
} from "../../utils/colors";
import { executeAfterKeyboardClosed } from "../../utils/keyboard";
import { useLogoutFromConverse } from "../../utils/logout";
import {
  compressAndResizeImage,
  pickMediaFromLibrary,
  takePictureFromCamera,
} from "../../utils/media";
import Button from "../Button/Button";
import { showActionSheetWithOptions } from "../StateHandlers/ActionSheetStateHandler";
import OnboardingComponent from "./OnboardingComponent";

export type ProfileType = {
  avatar: string;
  username: string;
  displayName: string;
};

export const UserProfile = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const colorScheme = useColorScheme();
  const styles = useStyles(colorScheme, errorMessage);

  const [profile, setProfile] = useState({
    username: "",
    avatar: "",
    displayName: "",
  } as ProfileType);
  const [loading, setLoading] = useState(false);
  const address = useCurrentAccount() as string;
  const logout = useLogoutFromConverse(address);

  const handleContinue = useCallback(async () => {
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

    if (!profile.avatar) {
      setErrorMessage("You must define an avatar");
      return;
    }

    if (profile.displayName.length < 3 || profile.displayName.length > 50) {
      setErrorMessage(
        "Your user name must be between 3 and 50 characters long"
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

    // Let's upload the image to our server
    const resizedImage = await compressAndResizeImage(profile.avatar);
    let publicAvatar = "";

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
      setErrorMessage(e?.response?.data?.message || "An unknown error occured");
      setLoading(false);
      return;
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
    }
  }, [address, profile]);

  const pickMedia = useCallback(async () => {
    const asset = await pickMediaFromLibrary();
    if (!asset) return;
    setProfile({ ...profile, avatar: asset.uri });
  }, [profile, setProfile]);

  const openCamera = useCallback(async () => {
    const asset = await takePictureFromCamera();
    if (!asset) return;
    setProfile({ ...profile, avatar: asset.uri });
  }, [profile, setProfile]);

  const addPFP = useCallback(() => {
    const showOptions = () =>
      showActionSheetWithOptions(
        {
          options: ["Camera", "Photo Library", "Cancel"],
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
      title="Profile"
      picto="person"
      primaryButtonText="Continue"
      primaryButtonAction={handleContinue}
      backButtonText="Back to home screen"
      backButtonAction={logout}
      isLoading={loading}
      shrinkWithKeyboard
    >
      <View style={styles.usernameInputContainer}>
        <Image source={{ uri: profile?.avatar }} style={styles.avatar} />
        <Button variant="text" title="Add PFP" onPress={addPFP} />
        <TextInput
          style={[textInputStyle(colorScheme), styles.usernameInput]}
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
        <TextInput
          style={[textInputStyle(colorScheme), styles.displayNameInput]}
          onChangeText={(text) => {
            // Limit the display name to 50 characters
            const trimmedDisplayName = text.slice(0, 50);
            setProfile({ ...profile, displayName: trimmedDisplayName });
          }}
          value={profile.displayName}
          placeholder="Display Name"
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
            "This is how people will find you and how you will appear to others."}
        </Text>
      </View>
    </OnboardingComponent>
  );
};

const useStyles = (colorScheme: any, errorMessage: any) =>
  StyleSheet.create({
    avatar: {
      width: 100,
      height: 100,
      borderWidth: 1,
    },
    usernameInputContainer: {
      width: "100%",
      paddingHorizontal: 32,
      marginTop: 50,
    },
    usernameInput: {
      width: "100%",
    },
    displayNameInput: {
      width: "100%",
      marginTop: 16,
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
