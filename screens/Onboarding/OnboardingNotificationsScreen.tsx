import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PictoSizes } from "@styles/sizes";
import * as Linking from "expo-linking";
import React from "react";
import { Platform } from "react-native";

import Button from "../../components/Button/Button";
import { OnboardingPictoTitleSubtitle } from "../../components/Onboarding/OnboardingPictoTitleSubtitle";
import { OnboardingPrimaryCtaButton } from "../../components/Onboarding/OnboardingPrimaryCtaButton";
import { OnboardingScreenComp } from "../../components/Onboarding/OnboardingScreenComp";
import { useSettingsStore } from "../../data/store/accountsStore";
import { useAppStore } from "../../data/store/appStore";
import { setAuthStatus } from "../../data/store/authStore";
import { VStack } from "../../design-system/VStack";
import { spacing } from "../../theme";
import { requestPushNotificationsPermissions } from "../../utils/notifications";
import { sentryTrackError } from "../../utils/sentry";
import { NavigationParamList } from "../Navigation/Navigation";

export function OnboardingNotificationsScreen(
  props: NativeStackScreenProps<NavigationParamList, "OnboardingNotifications">
) {
  const setNotificationsSettings = useSettingsStore(
    (s) => s.setNotificationsSettings
  );
  const setNotificationsPermissionStatus = useAppStore(
    (s) => s.setNotificationsPermissionStatus
  );

  return (
    <OnboardingScreenComp
      contentContainerStyle={{
        flex: 1,
        alignItems: "center",
      }}
    >
      <VStack
        style={{
          flex: 1,
        }}
      >
        <OnboardingPictoTitleSubtitle.Container>
          <OnboardingPictoTitleSubtitle.Picto
            picto="message.badge"
            size={PictoSizes.notification}
          />
          <OnboardingPictoTitleSubtitle.Title>
            Accept notifications
          </OnboardingPictoTitleSubtitle.Title>
          <OnboardingPictoTitleSubtitle.Subtitle>
            Converse is a messaging app, it works much better with
            notifications.
          </OnboardingPictoTitleSubtitle.Subtitle>
        </OnboardingPictoTitleSubtitle.Container>
      </VStack>

      <VStack
        style={{
          rowGap: spacing.lg,
          width: "100%",
          alignItems: "center",
        }}
      >
        <OnboardingPrimaryCtaButton
          title="Accept notifications"
          onPress={async () => {
            try {
              // Open popup
              const newStatus = await requestPushNotificationsPermissions();
              if (!newStatus) return;
              if (newStatus === "denied" && Platform.OS === "android") {
                // Android 13 always show denied first but sometimes
                // it will still show the popup. If not, go to Settings!
                Linking.openSettings();
              } else {
                setNotificationsSettings({ showNotificationScreen: false });
              }
              setNotificationsPermissionStatus(newStatus);
            } catch (error) {
              sentryTrackError(error);
            } finally {
              setAuthStatus("signedIn");
            }
          }}
        />

        <Button
          title="Later"
          variant="text"
          onPress={() => {
            setNotificationsSettings({ showNotificationScreen: false });
            setAuthStatus("signedIn");
          }}
        />
      </VStack>
    </OnboardingScreenComp>
  );
}
