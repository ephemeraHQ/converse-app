import { translate } from "@i18n/index";
import Clipboard from "@react-native-clipboard/clipboard";
import { NavigationProp } from "@react-navigation/native";
import {
  actionSheetColors,
  dangerColor,
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
import {
  useAccountsStore,
  useErroredAccountsMap,
} from "../data/store/accountsStore";
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
  const {
    setNotificationsPermissionStatus,
    notificationsPermissionStatus,
    isInternetReachable,
  } = useAppStore(
    useSelect([
      "setNotificationsPermissionStatus",
      "notificationsPermissionStatus",
      "isInternetReachable",
    ])
  );

  const { setCurrentAccount } = useAccountsStore(
    useSelect(["setCurrentAccount"])
  );
  const erroredAccountsMap = useErroredAccountsMap();
  const logout = useLogoutFromConverse(account);
  const colorScheme = useColorScheme();

  const showDeleteAccountActionSheet = useCallback(async () => {
    if (Platform.OS === "web") {
      // Fixes double action sheet on web
      await new Promise((r) => setTimeout(r, 100));
    }
    const methods = {
      [translate("disconnect")]: () => logout(false),
      [translate("disconnect_delete_group_chats")]: () => logout(true),
      [translate("cancel")]: () => {},
    };

    const options = Object.keys(methods);

    showActionSheetWithOptions(
      {
        options,
        title: translate("disconnect_this_account"),
        message: translate("disconnect_account_description"),
        cancelButtonIndex: options.indexOf(translate("cancel")),
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
      [translate("your_profile_page")]: async () => {
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
      [translate("copy_wallet_address")]: () => {
        Clipboard.setString(account || "");
      },
      [translate("turn_on_notifications")]: () => {
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
      [translate("disconnect_this_account")]: () => {
        showDeleteAccountActionSheet();
      },
      [translate("cancel")]: () => {},
    };

    const options = Object.keys(methods);
    const icons = [];
    if (erroredAccountsMap[account] && isInternetReachable) {
      icons.push(
        <Picto
          style={{
            width: PictoSizes.tableViewImage,
            height: PictoSizes.tableViewImage,
          }}
          size={PictoSizes.tableViewImage}
          picto="exclamationmark.triangle"
          color={dangerColor(colorScheme)}
        />
      );
    }
    if (notificationsPermissionStatus === "granted" || Platform.OS === "web") {
      options.splice(options.indexOf(translate("turn_on_notifications")), 1);
    }

    showActionSheetWithOptions(
      {
        options,
        icons,
        destructiveButtonIndex: options.indexOf(
          translate("disconnect_this_account")
        ),
        cancelButtonIndex: options.indexOf(translate("cancel")),
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
    erroredAccountsMap,
    account,
    isInternetReachable,
    notificationsPermissionStatus,
    colorScheme,
    setCurrentAccount,
    navigation,
    setNotificationsPermissionStatus,
    showDeleteAccountActionSheet,
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
