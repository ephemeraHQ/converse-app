import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { memo, useCallback, useEffect, useRef } from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  View,
  useColorScheme,
} from "react-native";

import { Avatar } from "../components/Avatar";
import Button from "../components/Button/Button";
import { Screen } from "../components/Screen/ScreenComp/Screen";
import { ScreenHeaderButton } from "../components/Screen/ScreenHeaderButton/ScreenHeaderButton";
import { Pressable } from "../design-system/Pressable";
import { Text } from "../design-system/Text";
import { translate } from "../i18n";
import {
  dangerColor,
  itemSeparatorColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../styles/colors";
import { sentryTrackError } from "../utils/sentry";
import { NavigationParamList } from "./Navigation/Navigation";
import { useProfile } from "@/features/onboarding/hooks/useProfile";
import { useCreateOrUpdateProfileInfo } from "@/features/onboarding/hooks/useCreateOrUpdateProfileInfo";
import { useAddPfp } from "@/features/onboarding/hooks/useAddPfp";

export const UserProfileScreen = memo(function UserProfileScreen(
  props: NativeStackScreenProps<NavigationParamList, "UserProfile">
) {
  const { navigation } = props;

  const colorScheme = useColorScheme();

  const { profile, setProfile } = useProfile();

  const { createOrUpdateProfile, loading, errorMessage } =
    useCreateOrUpdateProfileInfo();

  const styles = useUserProfileStyles(colorScheme, errorMessage);

  const handleSave = useCallback(async () => {
    try {
      const { success } = await createOrUpdateProfile({ profile });
      if (success) {
        navigation.popToTop();
      }
    } catch (error) {
      sentryTrackError(error);
    }
  }, [createOrUpdateProfile, profile, navigation]);

  useEffect(() => {
    navigation?.setOptions({
      headerRight: () => (
        <ScreenHeaderButton
          title="Save"
          onPress={handleSave}
          loading={loading}
        />
      ),
    });
  }, [loading, handleSave, navigation]);

  const usernameRef = useRef<TextInput>();

  const { addPFP, asset } = useAddPfp();

  useEffect(() => {
    if (asset) {
      setProfile((prevProfile) => ({ ...prevProfile, avatar: asset.uri }));
    }
  }, [asset, setProfile]);

  return (
    <Screen
      contentContainerStyle={{
        alignItems: "center",
      }}
    >
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
      <Text style={styles.p}>
        {errorMessage || translate("userProfile.converseProfiles")}
      </Text>
    </Screen>
  );
});

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
