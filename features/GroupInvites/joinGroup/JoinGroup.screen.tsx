import Button from "@components/Button/Button";
import { useCurrentAccount } from "@data/store/accountsStore";
import { translate } from "@i18n";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { NavigationParamList } from "@screens/Navigation/Navigation";
import {
  backgroundColor,
  dangerColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { GroupInvite } from "@utils/api.types";
import { useActor } from "@xstate/react";
import { StyleSheet, Text, View, useColorScheme } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { JoinGroupHeader } from "./components/JoinGroupHeader";
import {
  joinGroupMachineLogic,
  JoinGroupMachineContext,
} from "./joinGroup.machine";

interface UseJoinGroupResult {
  isGroupInviteLoading: boolean;
  polling: boolean;
  groupInvite: GroupInvite | undefined;
  joinStatus: JoinGroupMachineContext["joinStatus"];
  error: JoinGroupMachineContext["error"];
  groupJoinError: boolean;
  pollingTimedOut: boolean;
  joinButtonEnabled: boolean;
  joinGroup: () => void;
  openConversation: () => void;
  openConversationButtonEnabled: boolean;
}

function useJoinGroup(groupInviteId: string): UseJoinGroupResult {
  const navigation = useNavigation();
  /**
   * Current account should always be non-empty at this point in the application.
   * Ideally, the account would be consumed from the machine directly via
   * controlled dependencies. However, the way our dependencies are currently
   * set up makes that prohibitive for testing. So we pass the account as input
   * to the machine when it starts.
   *
   * This is not desirable and is a temporary workaround until we control more
   * of the dependencies around the account state management. This avoids
   * transitively importing native XMTP modules when we just want to import
   * state global functions, such as current account. The reason we want
   * to avoid transitively importing XMTP is because it litters our tests
   * with unnecessary mocks and distracts from what we're actually testing.
   */
  const account = useCurrentAccount() ?? "";
  const [state, send] = useActor(
    joinGroupMachineLogic.provide({
      actions: {
        navigateToGroupScreen: (_, params: { topic: string }) => {
          // @ts-expect-error TODO: this should work why isn't TS happy?
          navigation.replace("Conversation", { topic: params.topic });
        },
      },
    }),
    {
      input: { groupInviteId, account },
    }
  );

  const isGroupInviteLoading = state.hasTag("loading");
  const polling = state.hasTag("polling");
  const groupJoinError = state.hasTag("error");

  const { groupInviteMetadata: groupInvite, joinStatus, error } = state.context;

  const pollingTimedOut = state.value === "Attempting to Join Group Timed Out";

  const joinButtonEnabled =
    !polling && joinStatus === "PENDING" && state.status === "active";
  const openConversationButtonEnabled = !polling && joinStatus === "ACCEPTED";

  const joinGroup = () => {
    send({ type: "user.didTapJoinGroup" });
  };

  const openConversation = () => {
    send({ type: "user.didTapOpenConversation" });
  };

  return {
    isGroupInviteLoading,
    polling,
    groupInvite,
    joinStatus,
    error,
    groupJoinError,
    pollingTimedOut,
    joinButtonEnabled,
    joinGroup,
    openConversation,
    openConversationButtonEnabled,
  };
}

export function JoinGroupScreen({
  route,
}: NativeStackScreenProps<NavigationParamList, "GroupInvite">) {
  const groupInviteId = route.params.groupInviteId;
  // const groupInviteId = "ywyT6AEm8iz3skNVRzN5i";

  const {
    isGroupInviteLoading,
    polling,
    groupInvite,
    joinStatus,
    groupJoinError,
    pollingTimedOut,
    joinButtonEnabled,
    joinGroup,
    openConversation,
    openConversationButtonEnabled,
  } = useJoinGroup(groupInviteId);

  /**************************************************************
   * View/UI
   * ************************************************************/
  const styles = useStyles();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  return (
    <View style={styles.groupInviteContainer}>
      {isGroupInviteLoading && (
        <ActivityIndicator color={textPrimaryColor(colorScheme)} size="large" />
      )}
      {groupJoinError && (
        <Text style={styles.error}>{translate("An error occurred")}</Text>
      )}
      {groupInvite && (
        <>
          <JoinGroupHeader
            groupName={groupInvite.groupName}
            imageUrl={groupInvite.imageUrl}
            description={groupInvite.description}
          />
          {joinButtonEnabled && (
            <Button
              variant="primary"
              title={translate("Join group")}
              style={styles.cta}
              onPress={joinGroup}
            />
          )}
          {openConversationButtonEnabled && (
            <>
              <Text style={styles.accepted}>
                {translate("This invite has already been accepted")}
              </Text>
              <Button
                variant="primary"
                title={translate("Open conversation")}
                style={styles.cta}
                onPress={openConversation}
              />
            </>
          )}
          {polling && (
            <>
              <Button
                variant="primary"
                title={translate("Joining...")}
                style={styles.cta}
                disabled
              />
              <Text style={styles.notification}>
                {translate(
                  "A group admin may need to approve your membership prior to joining."
                )}
              </Text>
            </>
          )}
          {/* We may want to add some way for a user to get out of this state, but it's not likely to happen */}
          {joinStatus === "REJECTED" && (
            <Text style={styles.error}>
              {translate("This invite is no longer valid")}
            </Text>
          )}
          {pollingTimedOut && (
            <Text style={styles.notification}>
              {translate(
                "Your request has been sent. Wait for the admin approve you"
              )}
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
    groupInviteContainer: {
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
