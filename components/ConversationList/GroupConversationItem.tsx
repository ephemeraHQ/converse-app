import { showActionSheetWithOptions } from "@components/StateHandlers/ActionSheetStateHandler";
import { useGroupConsent } from "@hooks/useGroupConsent";
import { translate } from "@i18n/index";
import { useGroupNameQuery } from "@queries/useGroupNameQuery";
import { useGroupPhotoQuery } from "@queries/useGroupPhotoQuery";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { actionSheetColors } from "@styles/colors";
import { FC, useCallback } from "react";
import { useColorScheme } from "react-native";

import {
  useChatStore,
  useCurrentAccount,
} from "../../data/store/accountsStore";
import { useSelect } from "../../data/store/storeHelpers";
import { NavigationParamList } from "../../screens/Navigation/Navigation";
import { ConversationWithLastMessagePreview } from "../../utils/conversation";
import { conversationName } from "../../utils/str";
import ConversationListItem from "../ConversationListItem";

interface GroupConversationItemProps
  extends NativeStackScreenProps<
    NavigationParamList,
    "Chats" | "ShareFrame" | "ChatsRequests" | "Blocked"
  > {
  conversation: ConversationWithLastMessagePreview;
}

export const GroupConversationItem: FC<GroupConversationItemProps> = ({
  navigation,
  route,
  conversation,
}) => {
  const userAddress = useCurrentAccount() as string;
  const topic = conversation.topic;
  const lastMessagePreview = conversation.lastMessagePreview;
  const { data: groupName } = useGroupNameQuery(userAddress, topic, {
    refetchOnMount: false,
  });
  const { data: groupPhoto } = useGroupPhotoQuery(userAddress, topic, {
    refetchOnMount: false,
  });
  const { consent, blockGroup } = useGroupConsent(topic);
  const colorScheme = useColorScheme();
  const {
    initialLoadDoneOnce,
    openedConversationTopic,
    topicsData,
    setPinnedConversations,
  } = useChatStore(
    useSelect([
      "initialLoadDoneOnce",
      "openedConversationTopic",
      "topicsData",
      "setPinnedConversations",
    ])
  );

  const onLongPress = useCallback(() => {
    // Prevent this for blocked chats
    if (consent !== "denied") {
      setPinnedConversations([conversation]);
    }
  }, [setPinnedConversations, conversation, consent]);

  const handleDelete = useCallback(
    (defaultAction: () => void) => {
      showActionSheetWithOptions(
        {
          options: [
            translate("block"),
            translate("block_chat_and_inviter"),
            translate("cancel"),
          ],
          cancelButtonIndex: 2,
          destructiveButtonIndex: [0, 1],
          title: `Block ${groupName}?`,
          ...actionSheetColors(colorScheme),
        },
        async (selectedIndex?: number) => {
          if (selectedIndex === 0) {
            blockGroup({
              includeAddedBy: false,
              includeCreator: false,
            });
          } else if (selectedIndex === 1) {
            blockGroup({
              includeAddedBy: true,
              includeCreator: false,
            });
          } else {
            defaultAction();
          }
        }
      );
    },
    [blockGroup, colorScheme, groupName]
  );

  return (
    <ConversationListItem
      onLongPress={onLongPress}
      navigation={navigation}
      route={route}
      conversationPeerAddress={conversation.peerAddress}
      conversationPeerAvatar={groupPhoto}
      colorScheme={colorScheme}
      conversationTopic={conversation.topic}
      conversationTime={
        lastMessagePreview?.message?.sent || conversation.createdAt
      }
      conversationName={groupName ? groupName : conversationName(conversation)}
      showUnread={(() => {
        if (!initialLoadDoneOnce) return false;
        if (!lastMessagePreview) return false;
        // Manually marked as unread
        if (topicsData[conversation.topic]?.status === "unread") return true;
        // If not manually markes as unread, we only show badge if last message
        // not from me
        if (
          lastMessagePreview.message.senderAddress.toLowerCase() ===
          userAddress.toLowerCase()
        )
          return false;
        const readUntil = topicsData[conversation.topic]?.readUntil || 0;
        return readUntil < lastMessagePreview.message.sent;
      })()}
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
      onRightActionPress={handleDelete}
      isGroupConversation
    />
  );
};
