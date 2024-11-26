import { PinnedConversation } from "./PinnedConversation";
import { useCallback, useMemo } from "react";
import { navigate } from "@utils/navigation";
import Avatar from "@components/Avatar";
import { AvatarSizes } from "@styles/sizes";
import { DmWithCodecsType } from "@utils/xmtpRN/client";
import { usePreferredInboxName } from "@hooks/usePreferredInboxName";
import { usePreferredInboxAvatar } from "@hooks/usePreferredInboxAvatar";
import { useDmPeerInboxOnConversationList } from "@queries/useDmPeerInboxOnConversationList";
import { useChatStore, useCurrentAccount } from "@data/store/accountsStore";
import { useSelect } from "@/data/store/storeHelpers";
import {
  resetConversationListContextMenuStore,
  setConversationListContextMenuConversationData,
} from "@/features/conversation-list/ConversationListContextMenu.store";
import { translate } from "@i18n";
import { useToggleReadStatus } from "@/features/conversation-list/hooks/useToggleReadStatus";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/useMessageIsUnread";
import { useHandleDeleteDm } from "@/features/conversation-list/hooks/useHandleDeleteDm";

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

  const { data: peerInboxId } = useDmPeerInboxOnConversationList(
    currentAccount,
    conversation
  );

  const preferredName = usePreferredInboxName(peerInboxId);

  const preferredAvatar = usePreferredInboxAvatar(peerInboxId);

  const { setPinnedConversations } = useChatStore(
    useSelect(["setPinnedConversations"])
  );

  const timestamp = conversation?.lastMessage?.sentNs ?? 0;

  const isUnread = useConversationIsUnread({
    topic,
    lastMessage: conversation.lastMessage,
    conversation: conversation,
    timestamp,
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

  const contextMenuItems = useMemo(
    () => [
      {
        title: translate("unpin"),
        action: () => {
          setPinnedConversations([topic]);
          closeContextMenu();
        },
        id: "pin",
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
      },
      {
        title: translate("delete"),
        action: () => {
          handleDelete();
          closeContextMenu();
        },
        id: "delete",
      },
    ],
    [isUnread, setPinnedConversations, topic, toggleReadStatus, handleDelete]
  );

  const onLongPress = useCallback(() => {
    setConversationListContextMenuConversationData(topic, contextMenuItems);
  }, [contextMenuItems, topic]);

  const onPress = useCallback(() => {
    navigate("Conversation", { topic: conversation.topic });
  }, [conversation.topic]);

  const title = preferredName;
  const showUnread = false;

  const avatarComponent = useMemo(() => {
    return (
      <Avatar
        key={peerInboxId}
        uri={preferredAvatar ?? undefined}
        name={preferredName}
        size={AvatarSizes.pinnedConversation}
      />
    );
  }, [peerInboxId, preferredAvatar, preferredName]);

  return (
    <PinnedConversation
      avatarComponent={avatarComponent}
      onLongPress={onLongPress}
      onPress={onPress}
      showUnread={showUnread}
      title={title ?? ""}
    />
  );
};
