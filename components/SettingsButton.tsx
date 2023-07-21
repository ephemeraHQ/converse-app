import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useDisconnect } from "@thirdweb-dev/react-native";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import React, { useCallback, useContext } from "react";
import { Platform, TouchableOpacity, useColorScheme, View } from "react-native";

import config from "../config";
import { refreshProfileForAddress } from "../data";
import { AppContext } from "../data/store/context";
import { NotificationsDispatchTypes } from "../data/store/notificationsReducer";
import { NavigationParamList } from "../screens/Main";
import { actionSheetColors, textSecondaryColor } from "../utils/colors";
import { logout } from "../utils/logout";
import {
  requestPushNotificationsPermissions,
  NotificationPermissionStatus,
} from "../utils/notifications";
import { getTitleFontScale, shortAddress } from "../utils/str";
import Button from "./Button/Button";
import Picto from "./Picto/Picto";
import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";

export default function SettingsButton({
  navigation,
}: NativeStackScreenProps<NavigationParamList, "Messages">) {
  const { state, dispatch } = useContext(AppContext);
  const disconnectWallet = useDisconnect();
  const colorScheme = useColorScheme();
  const onPress = useCallback(() => {
    const methods = {
      "Your profile page": () => {
        if (state.xmtp.address) {
          refreshProfileForAddress(state.xmtp.address, dispatch);
          navigation.push("Profile", { address: state.xmtp.address });
        }
      },
      "Copy wallet address": () => {
        Clipboard.setStringAsync(state.xmtp.address || "");
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
        if (state.notifications.status === "denied") {
          if (Platform.OS === "android") {
            // Android 13 is always denied first so let's try to show
            requestPushNotificationsPermissions().then(
              (newStatus: NotificationPermissionStatus | undefined) => {
                if (newStatus === "denied") {
                  Linking.openSettings();
                } else if (newStatus) {
                  dispatch({
                    type: NotificationsDispatchTypes.NotificationsStatus,
                    payload: { status: newStatus },
                  });
                }
              }
            );
          } else {
            Linking.openSettings();
          }
        } else if (state.notifications.status === "undetermined") {
          // Open popup
          requestPushNotificationsPermissions().then(
            (newStatus: NotificationPermissionStatus | undefined) => {
              if (!newStatus) return;
              dispatch({
                type: NotificationsDispatchTypes.NotificationsStatus,
                payload: { status: newStatus },
              });
            }
          );
        }
      },
      Disconnect: () => {
        disconnectWallet();
        logout(state, dispatch);
      },
      Cancel: () => {},
    };

    const options = Object.keys(methods);
    if (state.notifications.status === "granted") {
      options.splice(options.indexOf("Turn on notifications"), 1);
    }

    showActionSheetWithOptions(
      {
        options,
        destructiveButtonIndex: options.indexOf("Disconnect"),
        cancelButtonIndex: options.indexOf("Cancel"),
        title: state.xmtp.address,
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
  }, [colorScheme, dispatch, state]);

  if (Platform.OS === "ios") {
    return (
      <View>
        <Button
          variant="text"
          allowFontScaling={false}
          textStyle={{ fontSize: 17 * getTitleFontScale() }}
          onPress={onPress}
          title={shortAddress(state.xmtp.address || "")}
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
