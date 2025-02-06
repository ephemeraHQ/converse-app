import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
import { ViewStyle } from "react-native";

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
  useCurrentAccount,
  useSettingsStore,
} from "../../../data/store/accountsStore";
import { setAuthStatus } from "../../../data/store/authStore";
import { NavigationParamList } from "../../../screens/Navigation/Navigation";

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

  const avatarUri = usePreferredAvatarUri(currentAccount);

  const displayName = usePreferredName(currentAccount);

  const handleEnableNotifications = useCallback(async () => {
    try {
      // TODO
    } catch (error) {
      captureError(error);
    } finally {
      setAuthStatus("signedIn");
    }
  }, []);

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
