import { useSelect } from "@/data/store/storeHelpers";
import { VStack } from "@/design-system/VStack";
import {
  resetConversationListContextMenuStore,
  setConversationListContextMenuConversationData,
} from "@/features/conversation-list/ConversationListContextMenu.store";
import { useHandleDeleteDm } from "@/features/conversation-list/hooks/useHandleDeleteDm";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/useMessageIsUnread";
import { useToggleReadStatus } from "@/features/conversation-list/hooks/useToggleReadStatus";
import { useDmPeerInboxId } from "@/queries/useDmPeerInbox";
import { useAppTheme } from "@/theme/useAppTheme";
import Avatar from "@components/Avatar";
import { useChatStore, useCurrentAccount } from "@data/store/accountsStore";
import { usePreferredInboxAvatar } from "@hooks/usePreferredInboxAvatar";
import { usePreferredInboxName } from "@hooks/usePreferredInboxName";
import { translate } from "@i18n";
import { navigate } from "@utils/navigation";
import { DmWithCodecsType } from "@/utils/xmtpRN/client.types";
import { useCallback, useMemo } from "react";
import { isTextMessage } from "../../features/conversation/conversation-message/conversation-message.utils";
import { ContextMenuIcon, ContextMenuItem } from "../ContextMenuItems";
import { PinnedConversation } from "./PinnedConversation";
import { PinnedMessagePreview } from "./PinnedMessagePreview";

type PinnedV3DMConversationProps = {
  conversation: DmWithCodecsType;
};

const closeContextMenu = () => {
  resetConversationListContextMenuStore();
};

export const PinnedV3DMConversation = ({
  conversation,
}: PinnedV3DMConversationProps) => {
  const currentAccount = useCurrentAccount()!;

  const topic = conversation.topic;

  const { data: peerInboxId } = useDmPeerInboxId({
    account: currentAccount!,
    topic,
  });

  const preferredName = usePreferredInboxName(peerInboxId);

  const preferredAvatar = usePreferredInboxAvatar(peerInboxId);

  const { setPinnedConversations } = useChatStore(
    useSelect(["setPinnedConversations"])
  );

  const timestamp = conversation?.lastMessage?.sentNs ?? 0;

  const isUnread = useConversationIsUnread({
    topic,
    lastMessage: conversation.lastMessage,
    timestampNs: timestamp,
  });

  const toggleReadStatus = useToggleReadStatus({
    topic,
    isUnread,
    currentAccount,
  });

  const handleDelete = useHandleDeleteDm({
    topic,
    preferredName,
    conversation,
  });

  const { theme } = useAppTheme();

  const contextMenuItems: ContextMenuItem[] = useMemo(
    () => [
      {
        title: translate("unpin"),
        action: () => {
          setPinnedConversations([topic]);
          closeContextMenu();
        },
        id: "pin",
        rightView: <ContextMenuIcon icon="pin.slash" />,
      },
      {
        title: isUnread
          ? translate("mark_as_read")
          : translate("mark_as_unread"),
        action: () => {
          toggleReadStatus();
          closeContextMenu();
        },
        id: "markAsUnread",
        rightView: (
          <ContextMenuIcon
            icon={isUnread ? "checkmark.message" : "message.badge"}
          />
        ),
      },
      {
        title: translate("delete"),
        action: () => {
          handleDelete();
          closeContextMenu();
        },
        id: "delete",
        titleStyle: {
          color: theme.colors.global.caution,
        },
        rightView: (
          <ContextMenuIcon icon="trash" color={theme.colors.global.caution} />
        ),
      },
    ],
    [
      isUnread,
      theme.colors.global.caution,
      setPinnedConversations,
      topic,
      toggleReadStatus,
      handleDelete,
    ]
  );

  const onLongPress = useCallback(() => {
    setConversationListContextMenuConversationData(topic, contextMenuItems);
  }, [contextMenuItems, topic]);

  const onPress = useCallback(() => {
    navigate("Conversation", { topic: conversation.topic });
  }, [conversation.topic]);

  const title = preferredName;

  const displayMessagePreview =
    conversation.lastMessage &&
    isTextMessage(conversation.lastMessage) &&
    isUnread;

  const avatarComponent = useMemo(() => {
    return (
      <Avatar
        key={peerInboxId}
        uri={preferredAvatar ?? undefined}
        name={preferredName}
        size={theme.avatarSize.xxl}
      />
    );
  }, [peerInboxId, preferredAvatar, preferredName, theme.avatarSize.xxl]);

  return (
    <VStack>
      <PinnedConversation
        avatarComponent={avatarComponent}
        onLongPress={onLongPress}
        onPress={onPress}
        showUnread={isUnread}
        title={title ?? ""}
      />
      {displayMessagePreview && (
        <PinnedMessagePreview message={conversation.lastMessage!} />
      )}
    </VStack>
  );
};
