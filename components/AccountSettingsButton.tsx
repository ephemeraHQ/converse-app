import Clipboard from "@react-native-clipboard/clipboard";
import { NavigationProp } from "@react-navigation/native";
import {
  actionSheetColors,
  primaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { PictoSizes } from "@styles/sizes";
import * as Linking from "expo-linking";
import React, { useCallback } from "react";
import {
  Keyboard,
  Platform,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

import Picto from "./Picto/Picto";
import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";
import { TableViewPicto } from "./TableView/TableViewImage";
import { refreshProfileForAddress } from "../data/helpers/profiles/profilesUpdate";
import { useAccountsStore } from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { useSelect } from "../data/store/storeHelpers";
import { converseEventEmitter } from "../utils/events";
import { useLogoutFromConverse } from "../utils/logout";
import { navigate } from "../utils/navigation";
import {
  NotificationPermissionStatus,
  requestPushNotificationsPermissions,
} from "../utils/notifications";

type Props = {
  account: string;
  navigation?: NavigationProp<any>;
};

export default function AccountSettingsButton({ account, navigation }: Props) {
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

  const showDeleteAccountActionSheet = useCallback(async () => {
    if (Platform.OS === "web") {
      // Fixes double action sheet on web
      await new Promise((r) => setTimeout(r, 100));
    }
    const methods = {
      Disconnect: () => logout(false),
      "Disconnect and delete group chats": () => logout(true),
      Cancel: () => {},
    };

    const options = Object.keys(methods);

    showActionSheetWithOptions(
      {
        options,
        title: "Disconnect this account",
        message:
          "Your group chats will be encrypted and saved on your device until you delete Converse. Your DMs will be backed up by the XMTP network.",
        cancelButtonIndex: options.indexOf("Cancel"),
        destructiveButtonIndex: [1],
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
  }, [colorScheme, logout]);

  const onPress = useCallback(() => {
    Keyboard.dismiss();

    const methods = {
      "Your profile page": async () => {
        if (account) {
          refreshProfileForAddress(account, account);
          setCurrentAccount(account, false);
          if (Platform.OS === "android") {
            converseEventEmitter.emit("toggle-navigation-drawer", false);
          } else {
            if (Platform.OS === "web") {
              await new Promise((r) => setTimeout(r, 200));
            }
            navigation?.navigate("Chats");
          }
          navigate("Profile", {
            address: account,
          });
        }
      },
      "Copy wallet address": () => {
        Clipboard.setString(account || "");
      },
      "Turn on notifications": () => {
        // @todo => move that to a helper because also used in Profile
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
      "Disconnect this account": () => {
        showDeleteAccountActionSheet();
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
        destructiveButtonIndex: options.indexOf("Disconnect this account"),
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
    showDeleteAccountActionSheet,
    navigation,
    notificationsPermissionStatus,
    setCurrentAccount,
    setNotificationsPermissionStatus,
  ]);

  return Platform.OS === "android" ? (
    <TouchableOpacity onPress={onPress}>
      <Picto
        picto="more_vert"
        size={PictoSizes.accoutSettings}
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
