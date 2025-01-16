import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PictoSizes } from "@styles/sizes";
import React from "react";

import { useAppTheme } from "@theme/useAppTheme";
import Button from "../../components/Button/Button";
import { OnboardingPictoTitleSubtitle } from "../../components/Onboarding/OnboardingPictoTitleSubtitle";
import { OnboardingPrimaryCtaButton } from "../../components/Onboarding/OnboardingPrimaryCtaButton";
import { OnboardingScreenComp } from "../../components/Onboarding/OnboardingScreenComp";
import { setAuthStatus } from "../../data/store/authStore";
import { VStack } from "../../design-system/VStack";
import { useNotificationsPermission } from "@/features/notifications/hooks/use-notifications-permission";
import { sentryTrackError } from "../../utils/sentry";
import { NavigationParamList } from "../Navigation/Navigation";

export function OnboardingNotificationsScreen(
  props: NativeStackScreenProps<NavigationParamList, "OnboardingNotifications">
) {
  const { theme } = useAppTheme();
  const { requestPermission, setNotificationsSettings } =
    useNotificationsPermission();

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
          rowGap: theme.spacing.lg,
          width: "100%",
          alignItems: "center",
        }}
      >
        <OnboardingPrimaryCtaButton
          title="Accept notifications"
          onPress={async () => {
            try {
              await requestPermission();
              setNotificationsSettings({ showNotificationScreen: false });
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
