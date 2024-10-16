import Button from "@components/Button/Button";
import { useDisconnectActionSheet } from "@hooks/useDisconnectActionSheet";
import { useNavigation } from "@react-navigation/native";
import {
  itemSeparatorColor,
  messageBubbleColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import React, {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import { useEnsureEventShimsAreLoaded } from "../features/Inspection/useEventTargetShim";

export default function EphemeralAccountBanner() {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  const showDisconnectActionSheet = useDisconnectActionSheet();
  const navigation = useNavigation();

  const loadedShims = useEnsureEventShimsAreLoaded();
  return (
    <TouchableOpacity
      onPress={() => showDisconnectActionSheet(colorScheme)}
      style={styles.tempAccountBanner}
    >
      <View style={styles.tempAccountBannerLeft}>
        <Text style={styles.tempAccountTitle}>This account is ephemeral</Text>
        <Text style={styles.tempAccountTitle}>
          {loadedShims ? "Loaded" : "Not loaded"}
        </Text>
        <Button
          variant="primary"
          onPress={() => {
            // @ts-expect-error
            navigation.navigate("GroupInvite");
          }}
          title="Test Gruop Invite"
        />
        <Text style={styles.tempAccountSubtitle} numberOfLines={4}>
          Disconnect to permanently remove your device from these conversations
          and ensure deniability.
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    tempAccountBanner: {
      width: "100%",
      borderBottomColor: itemSeparatorColor(colorScheme),
      backgroundColor: messageBubbleColor(colorScheme),
      paddingRight: 16,
      alignItems: "center",
      flexDirection: "row",
      top: 0,
      zIndex: 1000,
      ...Platform.select({
        default: {
          marginBottom: 8,
          paddingVertical: 12,
          paddingLeft: 30,
        },
        android: { paddingVertical: 14, paddingLeft: 16 },
      }),
    },
    tempAccountBannerLeft: {
      flexShrink: 1,
      marginRight: 10,
    },
    tempAccountTitle: {
      color: textPrimaryColor(colorScheme),
      ...Platform.select({
        default: {
          fontSize: 17,
          fontWeight: "600",
        },
        android: {
          fontSize: 16,
        },
      }),
    },
    tempAccountSubtitle: {
      fontSize: Platform.OS === "android" ? 14 : 15,
      color: textSecondaryColor(colorScheme),
      fontWeight: "400",
    },
  });
};
