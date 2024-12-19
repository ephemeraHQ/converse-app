import { PinnedConversation } from "./PinnedConversation";
import { useCallback, useMemo } from "react";
import { navigate } from "@utils/navigation";
import Avatar from "@components/Avatar";
import { useGroupConversationListAvatarInfo } from "@features/conversation-list/useGroupConversationListAvatarInfo";
import { useChatStore, useCurrentAccount } from "@data/store/accountsStore";
import { GroupAvatarDumb } from "@components/GroupAvatar";
import { GroupWithCodecsType } from "@/utils/xmtpRN/client.types";
import {
  resetConversationListContextMenuStore,
  setConversationListContextMenuConversationData,
} from "@/features/conversation-list/ConversationListContextMenu.store";
import { translate } from "@/i18n";
import { useSelect } from "@/data/store/storeHelpers";
import { useHandleDeleteGroup } from "@/features/conversation-list/hooks/useHandleDeleteGroup";
import { useToggleReadStatus } from "@/features/conversation-list/hooks/useToggleReadStatus";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/useMessageIsUnread";
import { useAppTheme } from "@/theme/useAppTheme";
import { ContextMenuIcon, ContextMenuItem } from "../ContextMenuItems";
import { isTextMessage } from "../../features/conversation/conversation-message/conversation-message.utils";
import { VStack } from "@/design-system/VStack";
import { PinnedMessagePreview } from "./PinnedMessagePreview";

type PinnedV3GroupConversationProps = {
  group: GroupWithCodecsType;
};

const closeContextMenu = () => {
  resetConversationListContextMenuStore();
};

export const PinnedV3GroupConversation = ({
  group,
}: PinnedV3GroupConversationProps) => {
  const currentAccount = useCurrentAccount()!;

  const topic = group.topic;

  const { memberData } = useGroupConversationListAvatarInfo(
    currentAccount!,
    group
  );

  const { setPinnedConversations } = useChatStore(
    useSelect(["setPinnedConversations"])
  );

  const timestamp = group?.lastMessage?.sentNs ?? 0;

  const { theme } = useAppTheme();

  const isUnread = useConversationIsUnread({
    topic,
    lastMessage: group.lastMessage,
    timestampNs: timestamp,
  });

  const toggleReadStatus = useToggleReadStatus({
    topic,
    isUnread,
    currentAccount,
  });

  const handleDelete = useHandleDeleteGroup(group);

  const contextMenuItems: ContextMenuItem[] = useMemo(() => {
    return [
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
    ];
  }, [
    handleDelete,
    isUnread,
    setPinnedConversations,
    theme.colors.global.caution,
    toggleReadStatus,
    topic,
  ]);

  const onLongPress = useCallback(() => {
    setConversationListContextMenuConversationData(
      group.topic,
      contextMenuItems
    );
  }, [contextMenuItems, group.topic]);

  const onPress = useCallback(() => {
    navigate("Conversation", { topic: group.topic });
  }, [group.topic]);

  const title = group?.name;

  const displayMessagePreview =
    group.lastMessage && isTextMessage(group.lastMessage) && isUnread;

  const avatarComponent = useMemo(() => {
    if (group?.imageUrlSquare) {
      return (
        <Avatar
          key={group?.topic}
          uri={group?.imageUrlSquare}
          size={theme.avatarSize.xxl}
        />
      );
    }
    return <GroupAvatarDumb size={theme.avatarSize.xxl} members={memberData} />;
  }, [group?.imageUrlSquare, group?.topic, memberData, theme.avatarSize.xxl]);

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
        <PinnedMessagePreview message={group.lastMessage!} />
      )}
    </VStack>
  );
};
