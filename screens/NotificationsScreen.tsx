import * as Linking from "expo-linking";
import React, { useContext } from "react";
import {
  View,
  StyleSheet,
  Text,
  useColorScheme,
  ColorSchemeName,
  Platform,
} from "react-native";

import Button from "../components/Button/Button";
import Picto from "../components/Picto/Picto";
import { AppContext } from "../data/store/context";
import { NotificationsDispatchTypes } from "../data/store/notificationsReducer";
import { textPrimaryColor } from "../utils/colors";
import { requestPushNotificationsPermissions } from "../utils/notifications";

export default function NotificationsScreen() {
  const { dispatch } = useContext(AppContext);
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  return (
    <View style={styles.notifications}>
      <Picto
        picto="message.badge"
        size={Platform.OS === "android" ? 80 : 43}
        style={styles.picto}
      />
      <Text style={styles.title}>Accept notifications</Text>
      <Text style={styles.p}>
        Converse is a messaging app, it works much better with notifications.
      </Text>
      <Button
        title="Accept notifications"
        variant="primary"
        onPress={async () => {
          // Open popup
          const newStatus = await requestPushNotificationsPermissions();
          if (!newStatus) return;
          if (newStatus === "denied" && Platform.OS === "android") {
            // Android 13 always show denied first but sometimes
            // it will still show the popup. If not, go to Settings!
            Linking.openSettings();
          } else {
            dispatch({
              type: NotificationsDispatchTypes.NotificationsShowScreen,
              payload: { show: false },
            });
          }
          dispatch({
            type: NotificationsDispatchTypes.NotificationsStatus,
            payload: { status: newStatus },
          });
        }}
      />
      <Button
        title="Later"
        style={styles.later}
        variant="text"
        textStyle={{ fontWeight: "600" }}
        onPress={() => {
          dispatch({
            type: NotificationsDispatchTypes.NotificationsShowScreen,
            payload: { show: false },
          });
        }}
      />
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    notifications: {
      flex: 1,
      alignItems: "center",
    },
    picto: {
      ...Platform.select({
        default: {
          marginTop: 124,
          marginBottom: 98,
        },
        android: {
          marginTop: 165,
          marginBottom: 61,
        },
      }),
    },
    title: {
      fontWeight: "700",
      fontSize: 34,
      color: textPrimaryColor(colorScheme),
    },
    p: {
      fontSize: 17,
      marginLeft: 32,
      marginRight: 32,
      textAlign: "center",
      marginTop: 21,
      marginBottom: "auto",
      color: textPrimaryColor(colorScheme),
    },
    later: {
      marginBottom: 54,
      marginTop: 21,
    },
  });
