import { invalidateGroupConsentQuery } from "@queries/useGroupConsentQuery";
import { invalidateGroupDescriptionQuery } from "@queries/useGroupDescriptionQuery";
import { invalidateGroupMembersQuery } from "@queries/useGroupMembersQuery";
import { invalidateGroupNameQuery } from "@queries/useGroupNameQuery";
import { invalidateGroupPhotoQuery } from "@queries/useGroupPhotoQuery";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import React, { useCallback, useRef } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NavigationParamList } from "./Navigation/Navigation";
import { GroupPendingRequestsTable } from "../containers/GroupPendingRequestsTable";
import { GroupScreenAddition } from "../containers/GroupScreenAddition";
import { GroupScreenConsentTable } from "../containers/GroupScreenConsentTable";
import { GroupScreenDescription } from "../containers/GroupScreenDescription";
import { GroupScreenImage } from "../containers/GroupScreenImage";
import { GroupScreenMembersTable } from "../containers/GroupScreenMembersTable";
import { GroupScreenName } from "../containers/GroupScreenName";
import { useChatStore, useCurrentAccount } from "../data/store/accountsStore";
import { XmtpGroupConversation } from "../data/store/chatStore";

export default function GroupScreen({
  route,
}: NativeStackScreenProps<NavigationParamList, "Group">) {
  const isFirstRun = useRef(false);
  const styles = useStyles();
  const group = useChatStore(
    (s) => s.conversations[route.params.topic]
  ) as XmtpGroupConversation;
  const insets = useSafeAreaInsets();
  const currentAccount = useCurrentAccount() as string;
  const topic = group.topic;

  useFocusEffect(
    useCallback(() => {
      // This can be changed to use AppState for the focus manager instead, but would need some additional checks to make sure it's not hitting the native bridge too often
      if (!isFirstRun.current) {
        isFirstRun.current = true;
        return;
      }
      // Favoring invalidating individual queries
      invalidateGroupNameQuery(currentAccount, topic);
      invalidateGroupDescriptionQuery(currentAccount, topic);
      invalidateGroupPhotoQuery(currentAccount, topic);
      invalidateGroupMembersQuery(currentAccount, topic);
      invalidateGroupConsentQuery(currentAccount, topic);
    }, [currentAccount, topic])
  );

  return (
    <ScrollView
      style={styles.group}
      contentContainerStyle={styles.groupContent}
    >
      <GroupScreenImage topic={topic} />
      <GroupScreenName topic={topic} />
      <GroupScreenDescription topic={topic} />
      <GroupScreenAddition topic={topic} />
      <GroupPendingRequestsTable topic={topic} />
      <GroupScreenMembersTable
        topic={topic}
        groupPermissionLevel={group.groupPermissionLevel}
      />
      <GroupScreenConsentTable topic={topic} />
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
      paddingHorizontal:
        Platform.OS === "ios" || Platform.OS === "web" ? 18 : 0,
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
