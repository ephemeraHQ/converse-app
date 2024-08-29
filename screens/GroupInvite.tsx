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
    const joinRequest = await createGroupJoinRequest(account, groupInvite?.id);
    setPolling(true);
    let count = 0;
    let status = "PENDING";
    setJoinStatus("PENDING");
    while (count < 10 && status === "PENDING") {
      const joinRequestData = await getGroupJoinRequest(joinRequest.id);
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
    cta: {
      marginTop: 20,
      borderRadius: 8,
      paddingVertical: 16,
      marginHorizontal: 4,
    },
  });
};
