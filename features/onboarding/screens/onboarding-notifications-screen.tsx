import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import React, { useCallback, useState } from "react";
import { Platform, ViewStyle } from "react-native";

import { useAppTheme } from "@theme/useAppTheme";
import {
  useCurrentAccount,
  useSettingsStore,
} from "../../../data/store/accountsStore";
import { useAppStore } from "../../../data/store/appStore";
import { setAuthStatus } from "../../../data/store/authStore";
import { requestPushNotificationsPermissions } from "../../notifications/utils/requestPushNotificationsPermissions";
import { sentryTrackError } from "../../../utils/sentry";
import { NavigationParamList } from "../../../screens/Navigation/Navigation";
import { AnimatedHStack } from "@/design-system/HStack";
import { Text } from "@/design-system/Text";
import { usePreferredAvatarUri } from "@/hooks/usePreferredAvatarUri";
import { usePreferredName } from "@/hooks/usePreferredName";
import { Avatar } from "@/components/Avatar";
import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { Center } from "@/design-system/Center";
import { translate } from "@/i18n";
import { Button } from "@/design-system/Button/Button";
import { OnboardingTitle } from "@/features/onboarding/components/onboarding-title";
import { OnboardingSubtitle } from "@/features/onboarding/components/onboarding-subtitle";
import { OnboardingNotificationRow } from "@/features/onboarding/components/onboarding-notification-row";

const $screenContainer: ViewStyle = {
  flex: 1,
  marginHorizontal: 16,
};

export function OnboardingNotificationsScreen(
  props: NativeStackScreenProps<NavigationParamList, "OnboardingNotifications">
) {
  const { theme } = useAppTheme();

  const currentAccount = useCurrentAccount()!;

  const setNotificationsSettings = useSettingsStore(
    (s) => s.setNotificationsSettings
  );
  const setNotificationsPermissionStatus = useAppStore(
    (s) => s.setNotificationsPermissionStatus
  );

  const avatarUri = usePreferredAvatarUri(currentAccount);

  const displayName = usePreferredName(currentAccount);

  const handleEnableNotifications = useCallback(async () => {
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
  }, [setNotificationsPermissionStatus, setNotificationsSettings]);

  const [isEssentialsEnabled, setIsEssentialsEnabled] = useState(true);

  const handleToggleEssentials = useCallback(() => {
    setIsEssentialsEnabled((prev) => !prev);
  }, []);

  return (
    <Screen
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={$screenContainer}
      preset="scroll"
    >
      <AnimatedHStack>
        <Avatar
          style={{ marginHorizontal: 8 }}
          size={theme.avatarSize.sm}
          uri={avatarUri}
          name={displayName}
        />
        <Text preset="body">{displayName}</Text>
      </AnimatedHStack>
      <Center style={{ flex: 1, flexDirection: "column" }}>
        <OnboardingTitle preset="title">
          {translate("onboarding.notifications.title")}
        </OnboardingTitle>
        <OnboardingSubtitle style={{ marginTop: 16, marginBottom: 24 }}>
          {translate("onboarding.notifications.subtitle")}
        </OnboardingSubtitle>
        <OnboardingNotificationRow
          title={translate("onboarding.notifications.essentials")}
          description={translate(
            "onboarding.notifications.essentialsDescription"
          )}
          value={isEssentialsEnabled}
          onToggle={handleToggleEssentials}
        />
        <OnboardingNotificationRow
          title={translate("onboarding.notifications.mentionsOnly")}
          description={translate(
            "onboarding.notifications.mentionsOnlyDescription"
          )}
          disabled
          value={false}
          onToggle={() => {}}
        />
        <OnboardingNotificationRow
          title={translate("onboarding.notifications.cash")}
          description={translate("onboarding.notifications.cashDescription")}
          disabled
          value={false}
          onToggle={() => {}}
        />
      </Center>
      <Button
        text={translate("onboarding.notifications.enableNotifications")}
        onPress={handleEnableNotifications}
        size="lg"
        style={{ flexShrink: 1 }}
      />
      <Button
        text={translate("onboarding.notifications.later")}
        variant="text"
        onPress={() => {
          setNotificationsSettings({ showNotificationScreen: false });
          setAuthStatus("signedIn");
        }}
      />
    </Screen>
  );
}
