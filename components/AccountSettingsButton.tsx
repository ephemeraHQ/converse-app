import Clipboard from "@react-native-clipboard/clipboard";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import React, { useCallback } from "react";
import {
  Keyboard,
  Platform,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

import config from "../config";
import { refreshProfileForAddress } from "../data/helpers/profiles/profilesUpdate";
import { useAccountsStore } from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { useSelect } from "../data/store/storeHelpers";
import { NavigationParamList } from "../screens/Navigation/Navigation";
import {
  actionSheetColors,
  primaryColor,
  textSecondaryColor,
} from "../utils/colors";
import { converseEventEmitter } from "../utils/events";
import { useLogoutFromConverse } from "../utils/logout";
import { navigate } from "../utils/navigation";
import {
  requestPushNotificationsPermissions,
  NotificationPermissionStatus,
} from "../utils/notifications";
import { refreshBalanceForAccounts } from "../utils/wallet";
import Picto from "./Picto/Picto";
import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";
import { TableViewPicto } from "./TableView/TableViewImage";

type Props = {
  account: string;
  navigation?: NativeStackNavigationProp<
    NavigationParamList,
    "Accounts",
    undefined
  >;
};

export default function AccountSettingsButton({ navigation, account }: Props) {
  const { setNotificationsPermissionStatus, notificationsPermissionStatus } =
    useAppStore(
      useSelect([
        "setNotificationsPermissionStatus",
        "notificationsPermissionStatus",
      ])
    );

  const { setCurrentAccount } = useAccountsStore(
    useSelect(["setCurrentAccount"])
  );
  const logout = useLogoutFromConverse(account);
  const colorScheme = useColorScheme();
  const onPress = useCallback(() => {
    Keyboard.dismiss();

    const methods = {
      "Your profile page": () => {
        if (account) {
          refreshProfileForAddress(account, account);
          refreshBalanceForAccounts();
          setCurrentAccount(account, false);
          if (Platform.OS === "android") {
            converseEventEmitter.emit("toggle-navigation-drawer", false);
          } else {
            navigation?.push("Chats");
          }
          navigate("Profile", {
            address: account,
          });
        }
      },
      "Copy wallet address": () => {
        Clipboard.setString(account || "");
      },
      "Contact Converse team": () => {
        setCurrentAccount(account, false);
        if (Platform.OS === "android") {
          // On android the drawer is outside the navigation
          // so we use Linking to navigate
          converseEventEmitter.emit("toggle-navigation-drawer", false);
        } else {
          navigation?.push("Chats");
        }
        navigate("Conversation", {
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
        logout();
      },
      Cancel: () => {},
    };

    const options = Object.keys(methods);
    if (notificationsPermissionStatus === "granted" || Platform.OS === "web") {
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
    account,
    colorScheme,
    logout,
    navigation,
    notificationsPermissionStatus,
    setCurrentAccount,
    setNotificationsPermissionStatus,
  ]);

  return Platform.OS === "android" ? (
    <TouchableOpacity onPress={onPress}>
      <Picto
        picto="more_vert"
        size={24}
        color={textSecondaryColor(colorScheme)}
      />
    </TouchableOpacity>
  ) : (
    <TableViewPicto
      symbol="info.circle"
      color={primaryColor(colorScheme)}
      onPress={onPress}
    />
  );
}
