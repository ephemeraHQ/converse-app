import { showActionSheetWithOptions } from "@components/StateHandlers/ActionSheetStateHandler";
import { useGroupConsent } from "@hooks/useGroupConsent";
import { useGroupQuery } from "@queries/useGroupQuery";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { actionSheetColors } from "@styles/colors";
import { saveTopicsData } from "@utils/api";
import { strings } from "@utils/i18n/strings";
import { FC, useCallback } from "react";
import { useColorScheme } from "react-native";

import {
  currentAccount,
  useChatStore,
  useCurrentAccount,
} from "../../data/store/accountsStore";
import { useSelect } from "../../data/store/storeHelpers";
import { useGroupName } from "../../hooks/useGroupName";
import { useGroupPhoto } from "../../hooks/useGroupPhoto";
import { NavigationParamList } from "../../screens/Navigation/Navigation";
import { ConversationWithLastMessagePreview } from "../../utils/conversation";
import { conversationName } from "../../utils/str";
import ConversationListItem from "../ConversationListItem";

interface GroupConversationItemProps
  extends NativeStackScreenProps<
    NavigationParamList,
    "Chats" | "ShareFrame" | "ChatsRequests"
  > {
  conversation: ConversationWithLastMessagePreview;
}

export const GroupConversationItem: FC<GroupConversationItemProps> = ({
  navigation,
  route,
  conversation,
}) => {
  const topic = conversation.topic;
  const lastMessagePreview = conversation.lastMessagePreview;
  const { data: group } = useGroupQuery(currentAccount(), topic);
  const { groupName } = useGroupName(topic);
  const { groupPhoto } = useGroupPhoto(topic);
  const { blockGroup } = useGroupConsent(topic);
  const colorScheme = useColorScheme();
  const userAddress = useCurrentAccount() as string;
  const {
    initialLoadDoneOnce,
    openedConversationTopic,
    topicsData,
    setTopicsData,
    setPinnedConversations,
  } = useChatStore(
    useSelect([
      "initialLoadDoneOnce",
      "openedConversationTopic",
      "topicsData",
      "setTopicsData",
      "setPinnedConversations",
    ])
  );

  const onLongPress = useCallback(() => {
    setPinnedConversations([conversation]);
  }, [setPinnedConversations, conversation]);

  const handleDelete = useCallback(
    (defaultAction: () => void) => {
      if (!group) return;
      showActionSheetWithOptions(
        {
          options: [
            strings.delete,
            strings.delete_and_block_inviter,
            strings.cancel,
          ],
          cancelButtonIndex: 2,
          destructiveButtonIndex: [0, 1],
          title: `Delete ${groupName}?`,
          ...actionSheetColors(colorScheme),
        },
        async (selectedIndex?: number) => {
          if (selectedIndex === 0) {
            saveTopicsData(currentAccount(), {
              [topic]: {
                status: "deleted",
                timestamp: new Date().getTime(),
              },
            });
            setTopicsData({
              [topic]: {
                status: "deleted",
                timestamp: new Date().getTime(),
              },
            });
            blockGroup({
              includeAddedBy: false,
              includeCreator: false,
            });
          } else if (selectedIndex === 1) {
            saveTopicsData(currentAccount(), {
              [topic]: { status: "deleted" },
            });
            setTopicsData({
              [topic]: {
                status: "deleted",
                timestamp: new Date().getTime(),
              },
            });
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
    [blockGroup, colorScheme, group, groupName, setTopicsData, topic]
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
        if (lastMessagePreview.message.senderAddress === userAddress)
          return false;
        const readUntil = topicsData[conversation.topic]?.readUntil || 0;
        return readUntil < lastMessagePreview.message.sent;
      })()}
      lastMessagePreview={
        lastMessagePreview ? lastMessagePreview.contentPreview : ""
      }
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
