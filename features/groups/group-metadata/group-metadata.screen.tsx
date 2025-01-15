import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { Text } from "@/design-system/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGroupQuery } from "@queries/useGroupQuery";
import { useCurrentAccount } from "@data/store/accountsStore";
import { NavigationParamList } from "@/screens/Navigation/Navigation";
import { useGroupMetadataHeader } from "./use-group-metadata-header";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { GroupScreenImage } from "./components/GroupScreenImage";
import { GroupScreenName } from "./components/GroupScreenName";
import { $globalStyles } from "@/theme/styles";
import { GroupScreenDescription } from "./components/GroupScreenDescription";
import { GroupScreenMembersTable } from "./components/GroupScreenMembersTable";
import { useGroupMembersQuery } from "@/queries/useGroupMembersQuery";

export function GroupMetadataScreen({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "GroupMetadata">) {
  const styles = useStyles();
  const currentAccount = useCurrentAccount() as string;
  // const topic = route.params.topic;
  const topic =
    "/xmtp/mls/1/g-e874e54b9e79ea064eba665c42b4bc34/proto" as ConversationTopic;

  useGroupMetadataHeader({ topic });
  

  const {
    data: group,
    isLoading,
    isError,
  } = useGroupQuery({
    account: currentAccount,
    topic,
  });
  const {
    data: membersEntityMap,
    isLoading: isMembersLoading,
    isError: isMembersError,
  } = useGroupMembersQuery({
    account: currentAccount,
    topic,
  });
  const insets = useSafeAreaInsets();

  if (isLoading) return <Text>Loading...</Text>;
  if (isError) return <Text>Error</Text>;
  if (!group) return null;
  if (!membersEntityMap) return null;

  const memberNameList = membersEntityMap.ids.map(
    (id) => membersEntityMap.byId[id].inboxId
  );

  const { name, description } = group;

  return (
    <ScrollView
      style={styles.group}
      contentContainerStyle={styles.groupContent}
    >
      <GroupScreenImage topic={topic} />
      <Text preset="title">{name}</Text>
      <Text preset="body">{description}</Text>
      {/* Memebers List */}
      <Text
        onPress={() => {
          navigation.navigate("InviteUsersToExistingGroup", {
            topicToInviteMembersTo: topic,
          });
        }}
      >
        Members ------------ +
      </Text>
      <Text preset="body">{memberNameList.join(", ")}</Text>
      <Text
        onPress={() => {
          navigation.navigate("ViewAllGroupMembers", {
            groupTopic: topic,
          });
        }}
      >
        See all 10 >
      </Text>
      <Text>Exit group</Text>
      {/* <GroupScreenMembersTable topic={topic} group={group} /> */}
      <View style={{ height: insets.bottom }} />
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
      paddingHorizontal: 18,
      ...$globalStyles.center,
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
