import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
import { ViewStyle, TextStyle } from "react-native";

import { Avatar } from "@/components/Avatar";
import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { Button } from "@/design-system/Button/Button";
import { Center } from "@/design-system/Center";
import { AnimatedHStack } from "@/design-system/HStack";
import { Text } from "@/design-system/Text";
import { OnboardingNotificationRow } from "@/features/onboarding/components/onboarding-notification-row";
import { OnboardingSubtitle } from "@/features/onboarding/components/onboarding-subtitle";
import { OnboardingTitle } from "@/features/onboarding/components/onboarding-title";
import { usePreferredAvatarUri } from "@/hooks/usePreferredAvatarUri";
import { usePreferredName } from "@/hooks/usePreferredName";
import { translate } from "@/i18n";
import { captureError } from "@/utils/capture-error";
import { useAppTheme } from "@theme/useAppTheme";
import {
  AuthStatuses,
  useAccountsStore,
  useCurrentAccount,
  useSettingsStore,
} from "@/features/multi-inbox/multi-inbox.store";
import { NavigationParamList } from "@/screens/Navigation/Navigation";

const $screenContainer: ViewStyle = {
  flex: 1,
  marginHorizontal: 16,
};

const $noticeText: TextStyle = {
  textAlign: "center",
  marginTop: 8,
  color: "gray",
};

export function OnboardingNotificationsScreen(
  props: NativeStackScreenProps<NavigationParamList, "OnboardingNotifications">
) {
  const { theme } = useAppTheme();

  const currentAccount = useCurrentAccount()!;

  const setNotificationsSettings = useSettingsStore(
    (s) => s.setNotificationsSettings
  );

  const avatarUri = usePreferredAvatarUri(currentAccount);

  const displayName = usePreferredName(currentAccount);

  const setAuthStatus = useAccountsStore((s) => s.setAuthStatus);
  const handleEnableNotifications = () => {
    try {
      // TODO
    } catch (error) {
      captureError(error);
    } finally {
      setAuthStatus(AuthStatuses.signedIn);
    }
  };

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
        <OnboardingTitle preset="title">Good vibrations only</OnboardingTitle>
        <OnboardingSubtitle style={{ marginTop: 16, marginBottom: 24 }}>
          Most things aren't urgent. Protect your attention by minimizing
          notifications.
        </OnboardingSubtitle>
        <OnboardingNotificationRow
          title={"Essentials"}
          description={"Notify me when approved contacts send messages"}
          value={true}
          onToggle={() => {}}
        />
      </Center>
      <Button
        text="Enable notifications"
        onPress={handleEnableNotifications}
        size="lg"
        style={{ flexShrink: 1 }}
      />
      <Text style={$noticeText} preset="body">
        Note: Notifications will be back soon
      </Text>
      <Button
        text="Later"
        variant="text"
        onPress={() => {
          setNotificationsSettings({ showNotificationScreen: false });
          setAuthStatus(AuthStatuses.signedIn);
        }}
      />
    </Screen>
  );
}
