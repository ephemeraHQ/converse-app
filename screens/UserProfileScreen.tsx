import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { memo, useCallback, useEffect, useRef } from "react";
import { TextInput, View, useColorScheme } from "react-native";

import Avatar from "../components/Avatar";
import Button from "../components/Button/Button";
import { Screen } from "../components/Screen/ScreenComp/Screen";
import { ScreenHeaderButton } from "../components/Screen/ScreenHeaderButton/ScreenHeaderButton";
import { Pressable } from "../design-system/Pressable";
import { Text } from "../design-system/Text";
import { translate } from "../i18n";
import { textSecondaryColor } from "../styles/colors";
import { sentryTrackError } from "../utils/sentry";
import { NavigationParamList } from "./Navigation/Navigation";
import {
  useAddPfp,
  useCreateOrUpdateProfileInfo,
  useProfile,
  useUserProfileStyles,
} from "./Onboarding/OnboardingUserProfileScreen";

export const UserProfileScreen = memo(function UserProfileScreen(
  props: NativeStackScreenProps<NavigationParamList, "UserProfile">
) {
  const { navigation } = props;

  const colorScheme = useColorScheme();

  const { profile, setProfile } = useProfile();

  // Was called when someone go back, maybe we put this in the GetStarted screen in useEffect ?
  // const logout = useLogoutFromConverse(address);
  // const loadingSubtitle = useLoopTxt(2000, LOADING_SENTENCES, loading, false);

  const { createOrUpdateProfile, loading, errorMessage } =
    useCreateOrUpdateProfileInfo();

  const styles = useUserProfileStyles(colorScheme, errorMessage);

  const handleSave = useCallback(async () => {
    try {
      const { success } = await createOrUpdateProfile({ profile });
      if (success) {
        navigation.goBack();
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
