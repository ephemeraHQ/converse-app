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
import { useGroupDescription } from "@/hooks/useGroupDescription";
import { useGroupName } from "@/hooks/useGroupName";

export function useEditGroupMetadataScreenHeader({
  topic,
}: {
  topic: ConversationTopic;
}) {
  const router = useRouter();
  logger.debug("topic", topic);

  useHeader({
    safeAreaEdges: ["top"],
    leftText: "Cancel",
    RightActionComponent: (
      <HStack
        style={{
          alignItems: "center",
          // columnGap: theme.spacing.xxs,
        }}
      >
        <HeaderAction
          text="Done"
          onPress={() => {
            alert("todo save");
          }}
        />
      </HStack>
    ),

    onBack: () => {
      router.goBack();
    },
  });
}

export function EditGroupMetadataScreen({
  route,
}: NativeStackScreenProps<NavigationParamList, "EditConversationMetadata">) {
  const styles = useStyles();
  const currentAccount = useCurrentAccount() as string;
  const topic = route.params.topic;

  useEditGroupMetadataScreenHeader({ topic });

  const { groupName, updateGroupName } = useGroupName(topic);
  const { groupDescription, setGroupDescription } = useGroupDescription(topic);

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
      <Text>Image preview with cute overlapping camera icon</Text>
      <Text>Group name with "name" label</Text>
      <Text>Group description with "description" label</Text>

      <Text>144/240</Text>
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
