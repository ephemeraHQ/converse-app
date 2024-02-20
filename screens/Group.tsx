import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import {
  StyleSheet,
  ScrollView,
  useColorScheme,
  Platform,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import TableView from "../components/TableView/TableView";
import {
  currentAccount,
  useChatStore,
  useProfilesStore,
} from "../data/store/accountsStore";
import { XmtpGroupConversation } from "../data/store/chatStore";
import { backgroundColor } from "../utils/colors";
import { getPreferredName } from "../utils/profile";
import { GroupWithCodecsType } from "../utils/xmtpRN/client";
import { getConversationWithTopic } from "../utils/xmtpRN/conversations";
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
      <TableView
        items={group.groupMembers.map((a) => ({
          id: a,
          title: getPreferredName(profiles[a]?.socials, a),
          action: async () => {
            const convo = (await getConversationWithTopic(
              currentAccount(),
              group.topic
            )) as GroupWithCodecsType;
            try {
              await convo.removeMembers([a]);
            } catch (e) {
              console.error(e);
            }
          },
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
    group: {
      backgroundColor: backgroundColor(colorScheme),
    },
    groupContent: {
      paddingHorizontal:
        Platform.OS === "ios" || Platform.OS === "web" ? 18 : 0,
    },
  });
};
