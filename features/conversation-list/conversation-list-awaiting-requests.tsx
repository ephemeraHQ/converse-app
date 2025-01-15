import { useCurrentAccount } from "@/data/store/accountsStore";
import { Center } from "@/design-system/Center";
import { Image } from "@/design-system/image";
import { ConversationListItem } from "@/features/conversation-list/conversation-list-item/conversation-list-item";
import { getUnknownConsentConversationsQueryOptions } from "@/queries/unknown-consent-conversations-query";
import { useAppTheme } from "@/theme/useAppTheme";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import React, { memo } from "react";

export const ConversationListAwaitingRequests = memo(
  function ConversationListAwaitingRequests() {
    const { theme } = useAppTheme();
    const { count, isLoading } = useRequestsCount();
    const navigation = useNavigation();

    if (count === 0 || isLoading) {
      return null;
    }

    return (
      <ConversationListItem
        title="Requests"
        onPress={() => {
          navigation.navigate("ChatsRequests");
        }}
        subtitle={`${count} awaiting your response`}
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
  const account = useCurrentAccount();

  const { data: unknownConsentConversations, isLoading } = useQuery(
    getUnknownConsentConversationsQueryOptions({
      account: account!,
      context: "useRequestsCount",
    })
  );

  const count = unknownConsentConversations?.length ?? 0;

  return { count, isLoading };
};
