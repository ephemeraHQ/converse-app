import Avatar from "@components/Avatar";
import { useGroupConsent } from "@hooks/useGroupConsent";
import { translate } from "@i18n";
import { NavigationParamList } from "@navigation/Navigation.types";
import { useGroupInviteQuery } from "@queries/useGroupInviteQuery";
import { fetchGroupsQuery } from "@queries/useGroupsQuery";
import { useHeaderHeight } from "@react-navigation/elements";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  backgroundColor,
  dangerColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import {
  createGroupJoinRequest,
  getGroupJoinRequest,
  GroupJoinRequestStatus,
} from "@utils/api";
import { getTopicFromGroupId } from "@utils/groupUtils/groupId";
import logger from "@utils/logger";
import { GroupWithCodecsType } from "@utils/xmtpRN/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, useColorScheme } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Button from "../components/Button/Button";
import { useCurrentAccount } from "../data/store/accountsStore";
import { refreshGroup } from "../utils/xmtpRN/conversations";

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
  const [
    { polling, finishedPollingUnsuccessfully, joinStatus },
    setGroupJoinState,
  ] = useState<{
    polling: boolean;
    /* Unsuccessfully here means that we have not yet received confirmation 
        from the invitee that we have been added to the group */
    finishedPollingUnsuccessfully: boolean;
    joinStatus: null | GroupJoinRequestStatus;
  }>({
    polling: false,
    finishedPollingUnsuccessfully: false,
    joinStatus: null,
  });
  const colorScheme = useColorScheme();
  const [newGroup, setNewGroup] = useState<GroupWithCodecsType | undefined>(
    undefined
  );
  const { allowGroup } = useGroupConsent(newGroup?.topic || "");
  const handlingNewGroup = useRef(false);

  const handleNewGroup = useCallback(
    async (group: GroupWithCodecsType) => {
      if (group.client.address === account && !handlingNewGroup.current) {
        handlingNewGroup.current = true;
        await allowGroup({
          includeCreator: false,
          includeAddedBy: false,
        });
        await refreshGroup(account, group.topic);
        navigation.replace("Conversation", { topic: group.topic });
      }
    },
    [account, allowGroup, navigation]
  );

  useEffect(() => {
    if (newGroup) {
      handleNewGroup(newGroup);
    }
  }, [handleNewGroup, newGroup]);

  const joinGroup = useCallback(async () => {
    if (!groupInvite?.id) return;
    setGroupJoinState({
      polling: true,
      finishedPollingUnsuccessfully: false,
      joinStatus: "PENDING",
    });
    const groupId = groupInvite.groupId;
    // Group ID is not available on previous versions of the app, so we need to fetch the groups
    const groupsBeforeJoining = await fetchGroupsQuery(account);
    if (groupId && groupsBeforeJoining.byId[getTopicFromGroupId(groupId)]) {
      // User has already been added to the group
      handleNewGroup(groupsBeforeJoining.byId[getTopicFromGroupId(groupId)]);
      return;
    }
    logger.debug(
      `[GroupInvite] Before joining, group count = ${groupsBeforeJoining.ids.length}`
    );
    logger.debug(
      `[GroupInvite] Sending the group join request to Converse backend`
    );
    const joinRequest = await createGroupJoinRequest(account, groupInvite?.id);
    const joinRequestId = joinRequest.id;
    let count = 0;
    let status: GroupJoinRequestStatus = "PENDING";
    while (count < 10 && status === "PENDING") {
      const joinRequestData = await getGroupJoinRequest(joinRequestId);
      logger.debug(
        `[GroupInvite] Group join request status is ${joinRequestData.status}`
      );
      if (joinRequestData.status === "PENDING") {
        await new Promise((r) => setTimeout(r, 500));
        count += 1;
      } else {
        status = joinRequestData?.status;
        break;
      }
    }
    if (status === "PENDING") {
      setGroupJoinState({
        polling: false,
        finishedPollingUnsuccessfully: true,
        joinStatus: "PENDING",
      });
    } else if (status === "ACCEPTED") {
      const groupsAfterJoining = await fetchGroupsQuery(account);
      // Group ID was not on original invites, so we need to handle it separately
      if (groupId) {
        logger.debug(`[GroupInvite] Group ID exists`);
        const groupTopic = getTopicFromGroupId(groupId);
        const group = groupsAfterJoining.byId[groupTopic];
        if (group) {
          logger.debug(`[GroupInvite] Group found`);
          // Check if the user has been removed from the group
          if (group.isGroupActive) {
            setNewGroup(group);
          } else {
            // The group is not active, so the user has been removed
            logger.debug(`[GroupInvite] Group not found`);
            setGroupJoinState({
              polling: false,
              finishedPollingUnsuccessfully: false,
              joinStatus: "REJECTED",
            });
          }
        } else {
          logger.debug(`[GroupInvite] Group not found`);
          setGroupJoinState({
            polling: false,
            finishedPollingUnsuccessfully: false,
            joinStatus: "ACCEPTED",
          });
        }
        return;
      }

      const oldGroupIds = new Set(groupsBeforeJoining.ids);
      const newGroupId = groupsAfterJoining.ids.find(
        (id) => !oldGroupIds.has(id)
      );
      if (newGroupId) {
        setNewGroup(groupsAfterJoining.byId[newGroupId]);
      } else {
        setGroupJoinState({
          polling: false,
          finishedPollingUnsuccessfully: false,
          joinStatus: "ACCEPTED",
        });
      }
    } else {
      setGroupJoinState({
        polling: false,
        finishedPollingUnsuccessfully: false,
        joinStatus: status,
      });
    }
  }, [groupInvite?.id, groupInvite?.groupId, account, handleNewGroup]);
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
          {joinStatus === "ACCEPTED" && (
            <Text style={styles.accepted}>
              {translate("group_already_joined")}
            </Text>
          )}
          {!polling &&
            joinStatus !== "ACCEPTED" &&
            joinStatus !== "REJECTED" && (
              <Button
                action="primary"
                title={translate("join_group")}
                style={styles.cta}
                onPress={joinGroup}
              />
            )}
          {polling && (
            <Button
              action="primary"
              title={translate("joining")}
              style={styles.cta}
            />
          )}
          {/* We may want to add some way for a user to get out of this state, but it's not likely to happen */}
          {joinStatus === "ERROR" && (
            <Text style={styles.error}>{translate("group_join_error")}</Text>
          )}
          {joinStatus === "REJECTED" && (
            <Text style={styles.error}>
              {translate("group_join_invite_invalid")}
            </Text>
          )}
          <Text style={styles.notification}>
            {translate("group_admin_approval")}
          </Text>
          {finishedPollingUnsuccessfully && (
            <Text style={styles.notification}>
              {translate("group_finished_polling_unsuccessfully")}
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
