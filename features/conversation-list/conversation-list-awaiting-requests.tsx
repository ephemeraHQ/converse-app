import { useCurrentAccount } from "@/data/store/accountsStore";
import { Center } from "@/design-system/Center";
import { Image } from "@/design-system/image";
import { ConversationListItem } from "@/features/conversation-list/conversation-list-item/conversation-list-item";
import { createConversationListQueryObserver } from "@/queries/useConversationListQuery";
import { useAppTheme } from "@/theme/useAppTheme";
import { useNavigation } from "@react-navigation/native";
import React, { memo, useEffect, useState } from "react";

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

  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = createConversationListQueryObserver({
      account: account!,
      context: "useRequestsCount",
    }).subscribe(({ data }) => {
      setCount(data?.filter((c) => c.state === "unknown").length ?? 0);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [account]);

  return { count, isLoading };
};
