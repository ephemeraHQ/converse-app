import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useDisconnect } from "@thirdweb-dev/react-native";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import React, { useCallback } from "react";
import { Platform, TouchableOpacity, useColorScheme, View } from "react-native";

import config from "../config";
import { refreshProfileForAddress } from "../data/helpers/profiles/profilesUpdate";
import { currentAccount, useUserStore } from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { NavigationParamList } from "../screens/Main";
import { actionSheetColors, textSecondaryColor } from "../utils/colors";
import { logout } from "../utils/logout";
import {
  requestPushNotificationsPermissions,
  NotificationPermissionStatus,
} from "../utils/notifications";
import { pick } from "../utils/objects";
import { getTitleFontScale, shortAddress } from "../utils/str";
import Button from "./Button/Button";
import Picto from "./Picto/Picto";
import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";

export default function SettingsButton({
  navigation,
}: NativeStackScreenProps<NavigationParamList, "Messages">) {
  const userAddress = useUserStore((s) => s.userAddress);
  const { setNotificationsPermissionStatus, notificationsPermissionStatus } =
    useAppStore((s) =>
      pick(s, [
        "notificationsPermissionStatus",
        "setNotificationsPermissionStatus",
      ])
    );
  const disconnectWallet = useDisconnect();
  const colorScheme = useColorScheme();
  const onPress = useCallback(() => {
    const methods = {
      "Your profile page": () => {
        if (userAddress) {
          refreshProfileForAddress(currentAccount(), userAddress);
          navigation.push("Profile", { address: userAddress });
        }
      },
      "Copy wallet address": () => {
        Clipboard.setStringAsync(userAddress || "");
      },
      "Contact Converse team": () => {
        Linking.openURL(
          Linking.createURL("/conversation", {
            queryParams: {
              mainConversationWithPeer: config.polAddress,
            },
          })
        );
      },
      "Turn on notifications": () => {
        if (notificationsPermissionStatus === "denied") {
          if (Platform.OS === "android") {
            // Android 13 is always denied first so let's try to show
            requestPushNotificationsPermissions().then(
              (newStatus: NotificationPermissionStatus | undefined) => {
                if (newStatus === "denied") {
                  Linking.openSettings();
                } else if (newStatus) {
                  setNotificationsPermissionStatus(newStatus);
                }
              }
            );
          } else {
            Linking.openSettings();
          }
        } else if (notificationsPermissionStatus === "undetermined") {
          // Open popup
          requestPushNotificationsPermissions().then(
            (newStatus: NotificationPermissionStatus | undefined) => {
              if (!newStatus) return;
              setNotificationsPermissionStatus(newStatus);
            }
          );
        }
      },
      Disconnect: () => {
        disconnectWallet();
        logout();
      },
      Cancel: () => {},
    };

    const options = Object.keys(methods);
    if (notificationsPermissionStatus === "granted") {
      options.splice(options.indexOf("Turn on notifications"), 1);
    }

    showActionSheetWithOptions(
      {
        options,
        destructiveButtonIndex: options.indexOf("Disconnect"),
        cancelButtonIndex: options.indexOf("Cancel"),
        title: userAddress || undefined,
        ...actionSheetColors(colorScheme),
      },
      (selectedIndex?: number) => {
        if (selectedIndex === undefined) return;
        const method = (methods as any)[options[selectedIndex]];
        if (method) {
          method();
        }
      }
    );
  }, [
    colorScheme,
    disconnectWallet,
    navigation,
    notificationsPermissionStatus,
    setNotificationsPermissionStatus,
    userAddress,
  ]);

  if (Platform.OS === "ios") {
    return (
      <View>
        <Button
          variant="text"
          allowFontScaling={false}
          textStyle={{ fontSize: 17 * getTitleFontScale() }}
          onPress={onPress}
          title={shortAddress(userAddress || "")}
        />
      </View>
    );
  } else {
    return (
      <TouchableOpacity onPress={onPress}>
        <Picto
          picto="account_circle"
          size={24}
          style={{ marginRight: 16 }}
          color={textSecondaryColor(colorScheme)}
        />
      </TouchableOpacity>
    );
  }
}
