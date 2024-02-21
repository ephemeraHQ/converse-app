import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import {
  StyleSheet,
  ScrollView,
  useColorScheme,
  Platform,
  View,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import TableView from "../components/TableView/TableView";
import { useChatStore, useProfilesStore } from "../data/store/accountsStore";
import { XmtpGroupConversation } from "../data/store/chatStore";
import { backgroundColor, textPrimaryColor } from "../utils/colors";
import { getPreferredName } from "../utils/profile";
import { conversationName } from "../utils/str";
import { NavigationParamList } from "./Navigation/Navigation";

export default function GroupScreen({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "Group">) {
  const styles = useStyles();
  const group = useChatStore(
    (s) => s.conversations[route.params.topic]
  ) as XmtpGroupConversation;
  const insets = useSafeAreaInsets();
  const profiles = useProfilesStore((s) => s.profiles);

  return (
    <ScrollView
      style={styles.group}
      contentContainerStyle={styles.groupContent}
    >
      <Text style={styles.title}>{conversationName(group)}</Text>
      <TableView
        items={group.groupMembers.map((a) => ({
          id: a,
          title: getPreferredName(profiles[a]?.socials, a),
          action: async () => {},
        }))}
        title="MEMBERS"
      />
      <View style={{ height: insets.bottom }} />
    </ScrollView>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    title: {
      color: textPrimaryColor(colorScheme),
      fontSize: 34,
      fontWeight: "bold",
      textAlign: "center",
      marginTop: 23,
    },
    group: {
      backgroundColor: backgroundColor(colorScheme),
    },
    groupContent: {
      paddingHorizontal:
        Platform.OS === "ios" || Platform.OS === "web" ? 18 : 0,
    },
  });
};
