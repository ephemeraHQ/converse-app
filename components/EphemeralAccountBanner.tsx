import Button from "@components/Button/Button";
import { useDisconnectActionSheet } from "@hooks/useDisconnectActionSheet";
import { translate } from "@i18n";
import { useNavigation } from "@react-navigation/native";
import { createSkyInspector } from "@statelyai/inspect";
import {
  itemSeparatorColor,
  messageBubbleColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { useActor } from "@xstate/react";
import React, {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { createMachine } from "xstate";

import { Controlled } from "../dependencies/Environment/Environment";
import { JoinGroupResult } from "../features/GroupInvites/joinGroup.types";

const simpleMachine = createMachine({
  id: "simpleMachine",
  context: { some: "stuff" },
});

const Thing = () => {
  const [state, send] = useActor(simpleMachine, {
    inspect: createSkyInspector({ clientType: "node" }).inspect,
  });
  return <Text>{JSON.stringify(state)}</Text>;
};

export default function EphemeralAccountBanner() {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  const showDisconnectActionSheet = useDisconnectActionSheet();
  const navigation = useNavigation();

  // const loadedShims = useEnsureEventShimsAreLoaded();
  return (
    <TouchableOpacity
      onPress={() => showDisconnectActionSheet(colorScheme)}
      style={styles.tempAccountBanner}
    >
      <View style={styles.tempAccountBannerLeft}>
        <Text style={styles.tempAccountTitle}>This account is ephemeral</Text>
        <Text style={styles.tempAccountTitle}>
          {translate(
            "Your request has been sent. Wait for the admin approve you"
          )}
        </Text>
        <Text style={styles.tempAccountTitle}>
          {translate("userProfile::title::profile")}
        </Text>

        {/*<Text style={styles.tempAccountTitle}>*/}
        {/*  {loadedShims ? "Loaded" : "Not loaded"}*/}
        {/*</Text>*/}
        {/*{loadedShims && <Thing />}*/}

        <Button
          variant="primary"
          onPress={() => {
            const timedOutResult: JoinGroupResult = {
              type: "group-join-request.timed-out",
            };

            Controlled.joinGroupClient.attemptToJoinGroup = async () =>
              timedOutResult;
            // @ts-expect-error
            navigation.navigate("GroupInvite");
          }}
          title="Test Gruop Invite (timed out) "
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
