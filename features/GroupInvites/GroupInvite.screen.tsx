import Avatar from "@components/Avatar";
import Button from "@components/Button/Button";
import { translate } from "@i18n";
import { useHeaderHeight } from "@react-navigation/elements";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavigationParamList } from "@screens/Navigation/Navigation";
import {
  backgroundColor,
  dangerColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import { useActor } from "@xstate/react";
import { StyleSheet, Text, View, useColorScheme } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { joinGroupMachineLogic } from "./joinGroup.machine";

export default function GroupInviteScreen({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "GroupInvite">) {
  const groupInviteId = route.params.groupInviteId;
  /**************************************************************
   * View/UI
   * ************************************************************/
  const styles = useStyles();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  /**************************************************************
   * State/Logic
   * ************************************************************/
  const [state, send] = useActor(
    joinGroupMachineLogic.provide({
      actions: {
        navigateToGroupScreen: (_, params: { topic: string }) => {
          navigation.navigate("Group", { topic: params.topic });
        },

        navigationGoBack: () => {
          navigation.goBack();
        },
      },
    }),
    {
      input: { groupInviteId },
    }
  );

  const isGroupInviteLoading = state.hasTag("loading");
  const polling = state.hasTag("polling");

  const { groupInviteMetadata: groupInvite, joinStatus, error } = state.context;

  const groupInviteError = error?.type === "fetchGroupInviteError";

  const pollingTimedOut = state.value === "Attempting to Join Group Timed Out";

  const joinButtonEnabled =
    !polling &&
    ["PENDING", "ACCEPTED", "REJECTED", "ERROR"].includes(joinStatus ?? "");

  const joinGroup = () => {
    send({ type: "user.didTapJoinGroup" });
  };

  return (
    <View style={styles.groupInvite}>
      {isGroupInviteLoading && (
        <ActivityIndicator color={textPrimaryColor(colorScheme)} size="large" />
      )}
      {groupInviteError && (
        <Text style={styles.error}>{translate("An error occurred")}</Text>
      )}
      {groupInvite && (
        <>
          <View style={styles.groupInfo}>
            <Avatar
              size={AvatarSizes.default}
              uri={groupInvite.imageUrl}
              name={groupInvite.groupName}
              style={styles.avatar}
            />
            <Text style={styles.title}>{groupInvite.groupName}</Text>
            {groupInvite.description && (
              <Text style={styles.description}>{groupInvite.description}</Text>
            )}
          </View>
          {joinStatus === "ACCEPTED" && (
            <Text style={styles.accepted}>
              {translate("This invite has already been accepted")}
            </Text>
          )}
          {joinButtonEnabled && (
            <Button
              variant="primary"
              title={translate("Join group")}
              style={styles.cta}
              onPress={joinGroup}
            />
          )}
          {polling && (
            <Button
              variant="primary"
              title={translate("Joining...")}
              style={styles.cta}
              disabled
            />
          )}
          {/* We may want to add some way for a user to get out of this state, but it's not likely to happen */}
          {joinStatus === "ERROR" && (
            <Text style={styles.error}>{translate("An error occurred")}</Text>
          )}
          {joinStatus === "REJECTED" && (
            <Text style={styles.error}>
              {translate("This invite is no longer valid")}
            </Text>
          )}
          <Text style={styles.notification}>
            {translate(
              "A group admin may need to approve your membership prior to joining."
            )}
          </Text>
          {pollingTimedOut && (
            <Text style={styles.notification}>
              {translate("This is taking longer than expected")}
            </Text>
          )}
        </>
      )}
      <View style={{ height: headerHeight - insets.bottom }} />
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    avatar: {
      alignSelf: "center",
      marginTop: 11,
    },
    groupInvite: {
      backgroundColor: backgroundColor(colorScheme),
      flex: 1,
      alignContent: "center",
      justifyContent: "flex-end",
      paddingHorizontal: 20,
    },
    groupInfo: {
      flex: 1,
    },
    title: {
      color: textPrimaryColor(colorScheme),
      fontSize: 25,
      fontWeight: "600",
      textAlign: "center",
      marginTop: 16,
    },
    description: {
      fontSize: 15,
      lineHeight: 22,
      color: textSecondaryColor(colorScheme),
      marginVertical: 12,
      marginHorizontal: 20,
      textAlign: "center",
    },
    error: {
      color: dangerColor(colorScheme),
      fontSize: 13,
      lineHeight: 18,
      paddingHorizontal: 20,
      textAlign: "center",
      marginTop: 8,
    },
    notification: {
      color: textSecondaryColor(colorScheme),
      fontSize: 13,
      lineHeight: 18,
      textAlign: "center",
      marginTop: 8,
    },
    accepted: {
      color: textSecondaryColor(colorScheme),
      fontSize: 20,
      lineHeight: 18,
      textAlign: "center",
      marginTop: 8,
      marginBottom: 20,
    },
    cta: {
      marginTop: 20,
      borderRadius: 16,
      marginHorizontal: 4,
    },
  });
};
