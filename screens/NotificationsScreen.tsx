import React, { useContext } from "react";
import { View, StyleSheet, Text } from "react-native";

import Button from "../components/Button";
import NotificationsSVG from "../components/svgs/notifications";
import { AppContext } from "../data/store/context";
import { NotificationsDispatchTypes } from "../data/store/notificationsReducer";
import { requestPushNotificationsPermissions } from "../utils/notifications";

export default function NotificationsScreen() {
  const { dispatch } = useContext(AppContext);
  return (
    <View style={styles.notifications}>
      <View style={styles.picto}>
        <NotificationsSVG />
      </View>
      <Text style={styles.title}>Accept notifications</Text>
      <Text style={styles.p}>
        Converse is a messaging app, it works much better with notifications.
      </Text>
      <Button
        title="Accept notifications"
        variant="blue"
        onPress={async () => {
          // Open popup
          const newStatus = await requestPushNotificationsPermissions();
          if (!newStatus) return;
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

const styles = StyleSheet.create({
  notifications: {
    flex: 1,
    alignItems: "center",
  },
  picto: {
    marginTop: 124,
    marginBottom: 50,
  },
  title: {
    fontWeight: "700",
    fontSize: 34,
  },
  p: {
    fontSize: 17,
    marginLeft: 32,
    marginRight: 32,
    textAlign: "center",
    marginTop: 21,
    marginBottom: "auto",
  },
  later: {
    marginBottom: 54,
    marginTop: 21,
  },
});
