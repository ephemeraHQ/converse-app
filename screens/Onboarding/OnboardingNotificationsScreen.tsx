import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PictoSizes } from "@styles/sizes";
import * as Linking from "expo-linking";
import React from "react";
import { Platform, StyleSheet, useColorScheme } from "react-native";

import Button from "../../components/Button/Button";
import { OnboardingPictoTitleSubtitle } from "../../components/Onboarding/OnboardingPictoTitleSubtitle";
import { OnboardingPrimaryCtaButton } from "../../components/Onboarding/OnboardingPrimaryCtaButton";
import { OnboardingScreen } from "../../components/Onboarding/OnboardingScreen";
import { useSettingsStore } from "../../data/store/accountsStore";
import { useAppStore } from "../../data/store/appStore";
import { debugBorder } from "../../utils/debug-style";
import { requestPushNotificationsPermissions } from "../../utils/notifications";
import { NavigationParamList } from "../Navigation/Navigation";

export function OnboardingNotificationsScreen(
  props: NativeStackScreenProps<NavigationParamList, "OnboardingNotifications">
) {
  const { navigation } = props;

  const styles = useStyles();

  const setNotificationsSettings = useSettingsStore(
    (s) => s.setNotificationsSettings
  );
  const setNotificationsPermissionStatus = useAppStore(
    (s) => s.setNotificationsPermissionStatus
  );

  return (
    <OnboardingScreen contentContainerStyle={styles.container}>
      {/* <Picto
        picto="message.badge"
        size={PictoSizes.notification}
        style={styles.picto}
      />
      <Text style={styles.title}>Accept notifications</Text>
      <Text style={styles.p}>
        Converse is a messaging app, it works much better with notifications.
      </Text> */}

      <OnboardingPictoTitleSubtitle.Container>
        <OnboardingPictoTitleSubtitle.Picto
          picto="message.badge"
          size={PictoSizes.notification}
        />
        <OnboardingPictoTitleSubtitle.Title>
          Accept notifications
        </OnboardingPictoTitleSubtitle.Title>
        <OnboardingPictoTitleSubtitle.Subtitle>
          Converse is a messaging app, it works much better with notifications.
        </OnboardingPictoTitleSubtitle.Subtitle>
      </OnboardingPictoTitleSubtitle.Container>

      <OnboardingPrimaryCtaButton
        title="Accept notifications"
        onPress={async () => {
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
        }}
      />

      <Button
        title="Later"
        style={styles.later}
        variant="text"
        onPress={() => {
          setNotificationsSettings({ showNotificationScreen: false });
          navigation.push("Chats");
        }}
      />
    </OnboardingScreen>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    container: {
      flex: 1,
      ...debugBorder(),
    },
    later: {
      marginBottom: 54,
      marginTop: 21,
    },
  });
};
