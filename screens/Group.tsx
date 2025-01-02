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
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GroupPendingRequestsTable } from "../containers/GroupPendingRequestsTable";
import { GroupScreenAddition } from "../containers/GroupScreenAddition";
import { GroupScreenConsentTable } from "../containers/GroupScreenConsentTable";
import { GroupScreenDescription } from "../containers/GroupScreenDescription";
import { GroupScreenImage } from "../containers/GroupScreenImage";
import { GroupScreenMembersTable } from "../containers/GroupScreenMembersTable";
import { GroupScreenName } from "../containers/GroupScreenName";
import { NavigationParamList } from "./Navigation/Navigation";
import { useCurrentAccount } from "../data/store/accountsStore";
import { useGroupQuery } from "@queries/useGroupQuery";

export default function GroupScreen({
  route,
}: NativeStackScreenProps<NavigationParamList, "Group">) {
  const styles = useStyles();
  const currentAccount = useCurrentAccount() as string;
  const topic = route.params.topic;

  const { data: group } = useGroupQuery({
    account: currentAccount,
    topic,
  });
  const insets = useSafeAreaInsets();

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
      <GroupScreenMembersTable topic={topic} group={group} />
      <GroupScreenConsentTable topic={topic} group={group} />
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
