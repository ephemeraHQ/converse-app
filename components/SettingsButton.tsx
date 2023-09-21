import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useDisconnect } from "@thirdweb-dev/react-native";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import React, { useCallback } from "react";
import { Keyboard, Platform, useColorScheme } from "react-native";

import config from "../config";
import { refreshProfileForAddress } from "../data/helpers/profiles/profilesUpdate";
import { currentAccount, useAccountsStore } from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { NavigationParamList } from "../screens/Navigation/Navigation";
import { actionSheetColors, primaryColor } from "../utils/colors";
import { logout } from "../utils/logout";
import {
  requestPushNotificationsPermissions,
  NotificationPermissionStatus,
} from "../utils/notifications";
import { pick } from "../utils/objects";
import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";
import { TableViewPicto } from "./TableView/TableViewImage";

type Props = {
  account: string;
} & NativeStackScreenProps<NavigationParamList, "Accounts">;

export default function SettingsButton({ navigation, account }: Props) {
  const { setNotificationsPermissionStatus, notificationsPermissionStatus } =
    useAppStore((s) =>
      pick(s, [
        "notificationsPermissionStatus",
        "setNotificationsPermissionStatus",
      ])
    );
  const setCurrentAccount = useAccountsStore((s) => s.setCurrentAccount);
  const disconnectWallet = useDisconnect();
  const colorScheme = useColorScheme();
  const onPress = useCallback(() => {
    Keyboard.dismiss();

    const methods = {
      "Your profile page": () => {
        if (account) {
          refreshProfileForAddress(currentAccount(), account);
          setCurrentAccount(account);
          navigation.push("Chats");
          navigation.push("Profile", { address: account });
        }
      },
      "Copy wallet address": () => {
        Clipboard.setStringAsync(account || "");
      },
      "Contact Converse team": () => {
        setCurrentAccount(account);
        navigation.push("Chats");
        navigation.push("Conversation", {
          mainConversationWithPeer: config.polAddress,
        });
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
        logout(currentAccount());
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
        title: account || undefined,
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
    notificationsPermissionStatus,
    account,
    colorScheme,
    setCurrentAccount,
    navigation,
    setNotificationsPermissionStatus,
    disconnectWallet,
  ]);

  return (
    <TableViewPicto
      symbol="info.circle"
      color={primaryColor(colorScheme)}
      onPress={onPress}
    />
  );
}
