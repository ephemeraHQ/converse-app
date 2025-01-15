import { Avatar } from "@/components/Avatar";
import {
  useAccountsList,
  useAccountsStore,
  useCurrentAccount,
} from "@/data/store/accountsStore";
import { Center } from "@/design-system/Center";
import { HStack } from "@/design-system/HStack";
import { HeaderAction } from "@/design-system/Header/HeaderAction";
import { Icon, iconRegistry } from "@/design-system/Icon/Icon";
import { Pressable } from "@/design-system/Pressable";
import { Text } from "@/design-system/Text";
import { usePreferredName } from "@/hooks/usePreferredName";
import { translate } from "@/i18n";
import { useHeader } from "@/navigation/use-header";
import { useAppTheme } from "@/theme/useAppTheme";
import { Haptics } from "@/utils/haptics";
import { shortDisplayName } from "@/utils/str";
import { useAccountsProfiles } from "@/utils/useAccountsProfiles";
import { useNavigation } from "@react-navigation/native";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import React from "react";
import { Alert, Platform } from "react-native";
import {
  ContextMenuButton,
  MenuActionConfig,
} from "react-native-ios-context-menu";

export function useGroupMetadataHeader({
  topic,
}: {
  topic: ConversationTopic;
}) {
  const { theme } = useAppTheme();
  const navigation = useNavigation();

  useHeader(
    {
      safeAreaEdges: ["top"],

      title: "Info",
      leftIcon: "chevron.left",

      RightActionComponent: (
        <HStack
          style={{
            alignItems: "center",
            columnGap: theme.spacing.xxs,
          }}
        >
          <HeaderAction
            icon="square.and.arrow.up"
            onPress={() => {
              navigation.navigate("ShareProfile");
            }}
          />
          <HeaderAction
            style={{
              marginBottom: 4, // The square.and.pencil icon is not centered with the qrcode if we don't have this margin
            }}
            icon=/*todo android*/ "pencil"
            onPress={() => {
              navigation.navigate("EditConversationMetadata", {
                topic,
              });
            }}
          />
        </HStack>
      ),
    },
    [navigation, theme]
  );
}
