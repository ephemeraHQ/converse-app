import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import React from "react";
import { Platform, ScrollView, StyleSheet, useColorScheme } from "react-native";
import { Text } from "@/design-system/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGroupQuery } from "@queries/useGroupQuery";
import { useCurrentAccount } from "@data/store/accountsStore";
import { NavigationParamList } from "@/screens/Navigation/Navigation";
import { useHeader } from "@/navigation/use-header";
import { HeaderProps } from "@/design-system/Header/Header";
import { useConversationRequestsListScreenHeader } from "@/features/conversation-requests-list/conversation-requests-list.screen-header";
import { useRouter } from "@/navigation/useNavigation";
import { translate } from "@/i18n";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { HeaderAction } from "@/design-system/Header/HeaderAction";
import { HStack } from "@/design-system/HStack";
import logger from "@/utils/logger";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { useGroupMembersQuery } from "@/queries/useGroupMembersQuery";

export function useViewAllGroupMembersScreenHeader({
  groupTopic,
  handleAddMemberClick,
}: {
  groupTopic: ConversationTopic;
  handleAddMemberClick: () => void;
}) {
  const router = useRouter();
  logger.debug("groupTopic", groupTopic);

  useHeader({
    // titleTx: "members",
    safeAreaEdges: ["top"],
    leftText: "Members",
    RightActionComponent: (
      <HStack
        style={{
          alignItems: "center",
          // columnGap: theme.spacing.xxs,
        }}
      >
        <HeaderAction icon="plus" onPress={handleAddMemberClick} />
      </HStack>
    ),

    onBack: () => {
      router.goBack();
    },
  });
}

export function ViewAllGroupMembersScreen({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "ViewAllGroupMembers">) {
  const styles = useStyles();
  const currentAccount = useCurrentAccount() as string;
  const groupTopic = route.params.groupTopic;

  // useConversationRequestsListScreenHeader();
  useViewAllGroupMembersScreenHeader({
    groupTopic,
    handleAddMemberClick: () => {
      navigation.navigate("InviteUsersToExistingGroup", {
        topicToInviteMembersTo: groupTopic,
      });
    },
  });

  // cancel and done
  // useHeader(headerData);

  const { data: group } = useGroupQuery({
    account: currentAccount,
    topic: groupTopic,
  });

  const {
    data: membersEntityMap,
    isLoading: isMembersLoading,
    isError: isMembersError,
  } = useGroupMembersQuery({
    account: currentAccount,
    topic: groupTopic,
  });

  if (isMembersLoading) return <Text>Loading...</Text>;
  if (isMembersError) return <Text>Error</Text>;
  if (!group) return null;
  if (!membersEntityMap) return null;

  const memberNameList = membersEntityMap.ids.map(
    (id) => membersEntityMap.byId[id].inboxId
  );

  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.group}
      contentContainerStyle={styles.groupContent}
    >
      <Text>{memberNameList.join("\n - - - \n")}</Text>
      <Text>member if current user is admin</Text>
      <Text>member if current user is super admin</Text>
      <Text>member if current user is not admin or super admin</Text>
      {/* <GroupScreenImage topic={topic} />
      <GroupScreenName topic={topic} />
      <GroupScreenDescription topic={topic} />
      <GroupScreenAddition topic={topic} />
      <GroupPendingRequestsTable topic={topic} />
      <GroupScreenMembersTable topic={topic} group={group} />
      <GroupScreenConsentTable topic={topic} group={group} />
      <View style={{ height: insets.bottom }} /> */}
    </ScrollView>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    description: {
      color: textPrimaryColor(colorScheme),
      fontSize: 13,
      textAlign: "center",
      marginTop: 13,
    },
    group: {
      backgroundColor: backgroundColor(colorScheme),
    },
    groupContent: {
      paddingHorizontal: Platform.OS === "ios" ? 18 : 0,
    },
    tableViewRight: {
      flexDirection: "row",
      alignItems: "center",
    },
    adminText: {
      fontSize: 17,
      color: textSecondaryColor(colorScheme),
    },
  });
};
