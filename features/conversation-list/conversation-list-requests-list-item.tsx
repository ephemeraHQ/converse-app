import { useCurrentAccount } from "@/data/store/accountsStore";
import { Center } from "@/design-system/Center";
import { Image } from "@/design-system/image";
import { ConversationListItem } from "@/features/conversation-list/conversation-list-item/conversation-list-item";
import { conversationListQueryConfig } from "@/queries/useConversationListQuery";
import { useAppTheme } from "@/theme/useAppTheme";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import React, { memo } from "react";

export const ConversationListRequestsListItem = memo(
  function ConversationListRequestsListItem() {
    const { theme } = useAppTheme();
    const requestsCount = useRequestsCount();
    const navigation = useNavigation();

    if (requestsCount === 0) {
      return null;
    }

    return (
      <ConversationListItem
        title="Requests"
        onPress={() => {
          navigation.navigate("ChatsRequests");
        }}
        subtitle={`${requestsCount} awaiting your response`}
        avatarComponent={
          <Center
            // {...debugBorder()}
            style={{
              width: theme.avatarSize.lg,
              height: theme.avatarSize.lg,
              backgroundColor: theme.colors.fill.primary,
              borderRadius: 999,
            }}
          >
            {/* TODO: Add skia to make it better and add the little "shield" icon */}
            <Image
              source={
                theme.isDark
                  ? require("@/assets/icons/chat-bubble-dark.png")
                  : require("@/assets/icons/chat-bubble-light.png")
              }
              style={{
                width: theme.avatarSize.sm,
                aspectRatio: 1,
              }}
              contentFit="contain"
            />
          </Center>
        }
      />
    );
  }
);

const useRequestsCount = () => {
  const currentAccount = useCurrentAccount();
  const { data: count = 0 } = useQuery({
    ...conversationListQueryConfig({
      account: currentAccount!,
      context: "useRequestsCount",
    }),
    select: (conversations) =>
      conversations?.filter((c) => c.state === "unknown").length ?? 0,
  });
  return count;
};
