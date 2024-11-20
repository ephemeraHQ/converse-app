import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { memo, useCallback, useRef } from "react";
import { TextInput, View, useColorScheme } from "react-native";

import Avatar from "../../components/Avatar";
import Button from "../../components/Button/Button";
import { NewAccountScreenComp } from "../../components/NewAccount/NewAccountScreenComp";
import { OnboardingPrimaryCtaButton } from "../../components/Onboarding/OnboardingPrimaryCtaButton";
import { Pressable } from "../../design-system/Pressable";
import { Text } from "../../design-system/Text";
import { VStack } from "../../design-system/VStack";
import { translate } from "../../i18n";
import { textSecondaryColor } from "../../styles/colors";
import { spacing } from "../../theme";
import { sentryTrackError } from "../../utils/sentry";
import { NavigationParamList } from "../Navigation/Navigation";
import {
  useAddPfp,
  useCreateOrUpdateProfileInfo,
  useProfile,
  useUserProfileStyles,
} from "../Onboarding/OnboardingUserProfileScreen";

export const NewAccountUserProfileScreen = memo(
  function NewAccountUserProfileScreen(
    props: NativeStackScreenProps<NavigationParamList, "NewAccountUserProfile">
  ) {
    const { navigation } = props;

    const colorScheme = useColorScheme();

    const { profile, setProfile } = useProfile();

    const { createOrUpdateProfile, loading, errorMessage } =
      useCreateOrUpdateProfileInfo();

    const styles = useUserProfileStyles(colorScheme, errorMessage);

    const handleContinue = useCallback(async () => {
      try {
        await createOrUpdateProfile({ profile });
        navigation.navigate("Chats");
      } catch (error) {
        sentryTrackError(error);
      }
    }, [createOrUpdateProfile, profile, navigation]);

    const usernameRef = useRef<TextInput>();

    const { addPFP, asset } = useAddPfp();

    return (
      <NewAccountScreenComp contentContainerStyle={{ alignItems: "center" }}>
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
            placeholder={translate(
              "userProfile.inputs.displayName.placeholder"
            )}
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
      </NewAccountScreenComp>
    );
  }
);
