import * as React from "react";
import { Image, StyleSheet, View } from "react-native";

import { MessageType, Theme } from "../../types";
import { CircularActivityIndicator } from "../CircularActivityIndicator";

export const StatusIcon = React.memo(
  ({
    currentUserIsAuthor,
    showStatus,
    status,
    theme,
  }: {
    currentUserIsAuthor: boolean;
    showStatus: boolean;
    status?: MessageType.Any["status"];
    theme: Theme;
  }) => {
    let statusIcon: React.ReactNode | null = null;

    if (showStatus) {
      switch (status) {
        case "delivered":
        case "sent":
          statusIcon = theme.icons?.deliveredIcon?.() ?? (
            <Image
              source={require("../../assets/icon-delivered.png")}
              style={{ tintColor: "white" }}
              testID="DeliveredIcon"
            />
          );
          break;
        case "error":
          statusIcon = theme.icons?.errorIcon?.() ?? (
            <Image
              source={require("../../assets/icon-error.png")}
              style={{ tintColor: "white" }}
              testID="ErrorIcon"
            />
          );
          break;
        case "seen":
          statusIcon = theme.icons?.seenIcon?.() ?? (
            <Image
              source={require("../../assets/icon-seen.png")}
              style={{ tintColor: "white" }}
              testID="SeenIcon"
            />
          );
          break;
        case "sending":
          statusIcon = theme.icons?.sendingIcon?.() ?? (
            <CircularActivityIndicator color="white" size={10} />
          );
          break;
        default:
          break;
      }
    }

    return currentUserIsAuthor ? (
      <View style={styles.container} testID="StatusIconContainer">
        {statusIcon}
      </View>
    ) : null;
  }
);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    height: 16,
    opacity: 0.6,
    justifyContent: "center",
    paddingHorizontal: 0,
    width: 16,
    right: 19,
    bottom: 3,
  },
});
