import Avatar from "@components/Avatar";
import Button from "@components/Button/Button";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useGroupConsent } from "@hooks/useGroupConsent";
import { translate } from "@i18n";
import { useGroupInviteQuery } from "@queries/useGroupInviteQuery";
import { fetchGroupsQuery } from "@queries/useGroupsQuery";
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
import {
  createGroupJoinRequest,
  getGroupJoinRequest,
  GroupJoinRequestStatus,
} from "@utils/api";
import { getTopicFromGroupId } from "@utils/groupUtils/groupId";
import logger from "@utils/logger";
import { navigate } from "@utils/navigation";
import { GroupWithCodecsType } from "@utils/xmtpRN/client";
import { refreshGroup } from "@utils/xmtpRN/conversations";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, useColorScheme } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getInviteJoinRequestId,
  saveInviteJoinRequestId,
} from "./groupInvites.utils";

export default function GroupInviteScreen({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "GroupInvite">) {
  /**************************************************************
   * View/UI
   * ************************************************************/
  const styles = useStyles();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  /**************************************************************
   * Zustand
   * ************************************************************/
  const account = useCurrentAccount() as string;

  /**************************************************************
   * React State
   * ************************************************************/
  // our hack requires us to keep track of the new group
  // added to the user's list of groups in order to
  // "handle" that they've joined it
  const [newGroup, setNewGroup] = useState<GroupWithCodecsType | undefined>(
    undefined
  );

  const handlingNewGroup = useRef(false);

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

  /**************************************************************
   * React Query
   * ************************************************************/
  const { allowGroup } = useGroupConsent(newGroup?.topic || "");
  const {
    data: groupInvite,
    error: groupInviteError,
    isLoading,
    // loads the group invite
    // caches group invite on invite ID and current account string
  } = useGroupInviteQuery(route.params.groupInviteId);

  const handleNewGroup = useCallback(
    async (group: GroupWithCodecsType) => {
      const wasInviteIntendedForUs =
        group.client.address === account && !handlingNewGroup.current;

      if (wasInviteIntendedForUs) {
        logger.debug("Handling new group", group);
        handlingNewGroup.current = true;

        await allowGroup({
          includeCreator: false,
          includeAddedBy: false,
        });
        await refreshGroup(account, group.topic);

        // Navigation Logic: Replace current screen with conversation screen for topic
        navigation.goBack();
        setTimeout(() => {
          navigate("Conversation", { topic: group.topic });
        }, 300);
      }
    },
    [account, allowGroup, navigation]
  );

  // invoked when the user clicks the "Join Group" button
  const joinGroup = useCallback(async () => {
    if (!groupInvite?.id) return;

    // we cant rely on our stream from the sdk at the moment,
    // so our hack is to poll
    //react state required to track implicit state machine
    setGroupJoinState({
      polling: true,
      finishedPollingUnsuccessfully: false,
      joinStatus: "PENDING",
    });
    const groupId = groupInvite.groupId;
    // Group ID is not available on previous versions of the app, so we need to fetch the groups
    // during our poll loop, we need to grab the old list in order to perform
    // a diff against it to determine what the new group added is
    // note: this is a bug if the user joins two groups ina very short time
    const groupsBeforeJoining = groupId
      ? { ids: [], byId: {} }
      : await fetchGroupsQuery(account);
    logger.debug(
      `[GroupInvite] Before joining, group count = ${groupsBeforeJoining.ids.length}`
    );
    // this is super strange logic, we're getting a string from mmkv,
    // assigning it to a variable called ID, then ignoring
    let joinRequestId = getInviteJoinRequestId(account, groupInvite?.id);
    if (!joinRequestId) {
      logger.debug(
        `[GroupInvite] Sending the group join request to Converse backend`
      );
      const joinRequest = await createGroupJoinRequest(
        account,
        groupInvite?.id
      );
      logger.debug("[GroupInvite] Join request created", joinRequest);
      joinRequestId = joinRequest.id;
      saveInviteJoinRequestId(account, groupInvite?.id, joinRequestId);
    }

    // polling logic (move to Dependency JoinGroupClient.listenForGroupJoinAcceptance)
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
  }, [account, groupInvite?.id, groupInvite?.groupId]);

  useEffect(() => {
    if (newGroup) {
      handleNewGroup(newGroup);
    }
  }, [handleNewGroup, newGroup]);

  logger.debug({
    account,
    groupInvite,
    groupInviteError,
    groupInviteLoading: isLoading,
    polling,
    finishedPollingUnsuccessfully,
    joinStatus,
    newGroup,
  });

  return (
    <View style={styles.groupInvite}>
      {isLoading && (
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
          {!polling &&
            joinStatus !== "ACCEPTED" &&
            joinStatus !== "REJECTED" && (
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
          {finishedPollingUnsuccessfully && (
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
