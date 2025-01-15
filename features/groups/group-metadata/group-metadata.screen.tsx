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
  Text,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGroupQuery } from "@queries/useGroupQuery";
import { useCurrentAccount } from "@data/store/accountsStore";
import { NavigationParamList } from "@/screens/Navigation/Navigation";

export function GroupMetadataScreen({
  route,
}: NativeStackScreenProps<NavigationParamList, "GroupMetadata">) {
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
      <Text>Sergeant buttface</Text>
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
