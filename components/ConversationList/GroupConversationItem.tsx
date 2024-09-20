import { useGroupConsent } from "@hooks/useGroupConsent";
import { useGroupNameQuery } from "@queries/useGroupNameQuery";
import { useGroupPhotoQuery } from "@queries/useGroupPhotoQuery";
import { showUnreadOnConversation } from "@utils/conversation/showUnreadOnConversation";
import { groupRemoveRestoreHandler } from "@utils/groupUtils/groupActionHandlers";
import { FC, useCallback } from "react";
import { useColorScheme } from "react-native";

import {
  useChatStore,
  useCurrentAccount,
} from "../../data/store/accountsStore";
import { useSelect } from "../../data/store/storeHelpers";
import { ConversationWithLastMessagePreview } from "../../utils/conversation";
import { conversationName } from "../../utils/str";
import ConversationListItem from "../ConversationListItem";

interface GroupConversationItemProps {
  conversation: ConversationWithLastMessagePreview;
}

export const GroupConversationItem: FC<GroupConversationItemProps> = ({
  conversation,
}) => {
  const userAddress = useCurrentAccount() as string;
  const topic = conversation.topic;
  const lastMessagePreview = conversation.lastMessagePreview;
  const { data: groupName } = useGroupNameQuery(userAddress, topic, {
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const { data: groupPhoto } = useGroupPhotoQuery(userAddress, topic, {
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const { consent, blockGroup, allowGroup } = useGroupConsent(topic, {
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const colorScheme = useColorScheme();
  const { initialLoadDoneOnce, openedConversationTopic, topicsData } =
    useChatStore(
      useSelect([
        "initialLoadDoneOnce",
        "openedConversationTopic",
        "topicsData",
      ])
    );

  const handleRemoveRestore = useCallback(() => {
    groupRemoveRestoreHandler(
      consent,
      colorScheme,
      groupName,
      allowGroup,
      blockGroup
    )((success: boolean) => {
      // If not successful, do nothing (user canceled)
    });
  }, [consent, colorScheme, groupName, allowGroup, blockGroup]);

  return (
    <ConversationListItem
      conversationPeerAddress={conversation.peerAddress}
      conversationPeerAvatar={groupPhoto}
      colorScheme={colorScheme}
      conversationTopic={conversation.topic}
      conversationTime={
        lastMessagePreview?.message?.sent || conversation.createdAt
      }
      conversationName={groupName ? groupName : conversationName(conversation)}
      showUnread={showUnreadOnConversation(
        initialLoadDoneOnce,
        lastMessagePreview,
        topicsData,
        conversation,
        userAddress
      )}
      lastMessagePreview={
        lastMessagePreview ? lastMessagePreview.contentPreview : ""
      }
      lastMessageImageUrl={lastMessagePreview?.imageUrl}
      lastMessageStatus={lastMessagePreview?.message?.status}
      lastMessageFromMe={
        !!lastMessagePreview &&
        lastMessagePreview.message?.senderAddress === userAddress
      }
      conversationOpened={conversation.topic === openedConversationTopic}
      onRightActionPress={handleRemoveRestore}
      isGroupConversation
    />
  );
};
