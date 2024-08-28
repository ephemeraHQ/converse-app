import Avatar from "@components/Avatar";
import { translate } from "@i18n";
import { useGroupInviteQuery } from "@queries/useGroupInviteQuery";
import { useHeaderHeight } from "@react-navigation/elements";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  backgroundColor,
  dangerColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import { createGroupJoinRequest, getGroupJoinRequest } from "@utils/api";
import { converseEventEmitter } from "@utils/events";
import {
  getInviteJoinRequest,
  saveInviteJoinRequest,
} from "@utils/groupInvites";
import { GroupWithCodecsType } from "@utils/xmtpRN/client";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View, useColorScheme } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NavigationParamList } from "./Navigation/Navigation";
import Button from "../components/Button/Button";
import { useCurrentAccount } from "../data/store/accountsStore";
import { navigate } from "../utils/navigation";
import {
  consentToGroupsOnProtocol,
  refreshGroup,
} from "../utils/xmtpRN/conversations";

export default function GroupInviteScreen({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "GroupInvite">) {
  const styles = useStyles();
  const account = useCurrentAccount() as string;
  const {
    data: groupInvite,
    error: groupInviteError,
    isLoading,
  } = useGroupInviteQuery(route.params.groupInviteId);
  const [polling, setPolling] = useState<boolean>(false);
  const [finishedPolling, setFinishedPolling] = useState<boolean>(false);
  const [joinStatus, setJoinStatus] = useState<
    null | "PENDING" | "ERROR" | "REJECTED" | "ACCEPTED"
  >(null);
  const colorScheme = useColorScheme();

  const handleNewGroup = useCallback(
    async (group: GroupWithCodecsType) => {
      if (group.client.address === account) {
        await consentToGroupsOnProtocol(account, [group.id], "allow");
        await refreshGroup(account, group.topic);
        navigation.goBack();
        setTimeout(() => {
          navigate("Conversation", { topic: group.topic });
        }, 300);
      }
    },
    [account, navigation]
  );

  const joinGroup = useCallback(async () => {
    if (!groupInvite?.id) return;
    converseEventEmitter.on("newGroup", handleNewGroup);
    let joinRequestId = getInviteJoinRequest(account, groupInvite?.id);
    if (!joinRequestId) {
      const joinRequest = await createGroupJoinRequest(
        account,
        groupInvite?.id
      );
      joinRequestId = joinRequest.id;
      saveInviteJoinRequest(account, groupInvite?.id, joinRequestId);
    }
    setPolling(true);
    let count = 0;
    let status = "PENDING";
    setJoinStatus("PENDING");
    while (count < 10 && status === "PENDING") {
      const joinRequestData = await getGroupJoinRequest(joinRequestId);
      if (joinRequestData.status === "PENDING") {
        await new Promise((r) => setTimeout(r, 500));
        count += 1;
      } else {
        status = joinRequestData?.status;
        setJoinStatus(joinRequestData?.status);
        break;
      }
    }
    if (count === 10 && status === "PENDING") {
      setFinishedPolling(true);
    } else {
      setPolling(false);
    }

    return () => {
      converseEventEmitter.off("newGroup", handleNewGroup);
    };
  }, [account, groupInvite?.id, handleNewGroup]);
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  return (
    <View style={styles.groupInvite}>
      {isLoading && (
        <ActivityIndicator color={textPrimaryColor(colorScheme)} size="large" />
      )}
      {groupInviteError && (
        <Text style={styles.error}>{translate("group_join_error")}</Text>
      )}
      {groupInvite && (
        <>
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
          {!polling && (
            <Button
              variant="primary"
              title={translate("join_group")}
              style={styles.cta}
              onPress={joinGroup}
            />
          )}
          {joinStatus === "PENDING" && (
            <Button
              variant="primary"
              title={translate("joining")}
              style={styles.cta}
            />
          )}
          <Text style={styles.notification}>
            {translate("group_admin_approval")}
          </Text>
          {finishedPolling && (
            <Text style={styles.notification}>
              {translate("group_finished_polling")}
            </Text>
          )}
          {joinStatus === "ERROR" && (
            <Text style={styles.error}>{translate("group_join_error")}</Text>
          )}
          {joinStatus === "REJECTED" && (
            <Text style={styles.error}>
              {translate("group_join_invite_invalid")}
            </Text>
          )}
        </>
      )}
      <View style={{ height: insets.bottom + headerHeight }} />
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    avatar: {
      alignSelf: "center",
    },
    groupInvite: {
      backgroundColor: backgroundColor(colorScheme),
      flex: 1,
      alignContent: "center",
      justifyContent: "flex-end",
      paddingHorizontal: 20,
    },
    title: {
      color: textPrimaryColor(colorScheme),
      fontSize: 30,
      fontWeight: "bold",
      textAlign: "center",
      marginTop: 23,
      marginBottom: 20,
    },
    description: {
      fontSize: 17,
      color: textPrimaryColor(colorScheme),
      marginVertical: 20,
      fontStyle: "italic",
      textAlign: "center",
    },
    error: {
      color: dangerColor(colorScheme),
      fontSize: 17,
      paddingHorizontal: 20,
      textAlign: "center",
      marginTop: 20,
    },
    notification: {
      color: textSecondaryColor(colorScheme),
      fontSize: 17,
      textAlign: "center",
      marginTop: 20,
    },
    cta: {
      marginTop: 20,
    },
  });
};
