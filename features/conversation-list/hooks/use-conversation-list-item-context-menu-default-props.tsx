import { iconRegistry } from "@/design-system/Icon/Icon";
import { VStack } from "@/design-system/VStack";
import { useConversationByTopic } from "@/features/conversation-list/hooks/use-conversation-by-topic";
import { useConversationIsPinned } from "@/features/conversation-list/hooks/use-conversation-is-pinned";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/use-conversation-is-unread";
import { useDeleteDm } from "@/features/conversation-list/hooks/use-delete-dm";
import { useDeleteGroup } from "@/features/conversation-list/hooks/use-delete-group";
import { useToggleReadStatus } from "@/features/conversation-list/hooks/use-toggle-read-status";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { translate } from "@/i18n";
import { ConversationReadOnly } from "@/screens/ConversationReadOnly";
import { useAppTheme } from "@/theme/useAppTheme";
import { captureErrorWithToast } from "@/utils/capture-error";
import { Haptics } from "@/utils/haptics";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import {
  ContextMenuViewProps,
  MenuActionConfig,
} from "react-native-ios-context-menu";
import { usePinOrUnpinConversation } from "./use-pin-or-unpin-conversation";

export function useConversationContextMenuViewDefaultProps(args: {
  conversationTopic: ConversationTopic;
}) {
  const { conversationTopic } = args;

  const { theme } = useAppTheme();

  const pinMenuItem = useConversationContextMenuPinItem({ conversationTopic });
  const readMenuItem = useConversationContextMenuReadItem({
    conversationTopic,
  });
  const deleteMenuItem = useConversationContextMenuDeleteItem({
    conversationTopic,
  });

  const menuItems = [pinMenuItem, readMenuItem, deleteMenuItem];

  return {
    shouldWaitForMenuToHideBeforeFiringOnPressMenuItem: false,
    menuConfig: {
      menuTitle: "",
      menuItems,
    },
    previewConfig: {
      previewType: "CUSTOM",
      previewSize: "STRETCH",
      backgroundColor: theme.colors.background.surface,
    },
    renderPreview: () => {
      return (
        <VStack
          style={{
            flex: 1,
            paddingBottom: theme.spacing.xs,
          }}
        >
          <ConversationReadOnly topic={conversationTopic} />
        </VStack>
      );
    },
    onPressMenuItem: (event) => {
      Haptics.selectionAsync();
      const action = menuItems.find(
        (item) => item.actionKey === event.nativeEvent.actionKey
      );
      if (action) {
        action.onPress();
      } else {
        console.warn("No action found for", event.nativeEvent.actionKey);
      }
    },
    onPressMenuPreview: () => {
      // TODO
    },
  } satisfies ContextMenuViewProps;
}

type IUseContextMenuItem = MenuActionConfig & { onPress: () => void };

function useConversationContextMenuPinItem(args: {
  conversationTopic: ConversationTopic;
}): IUseContextMenuItem {
  const { conversationTopic } = args;

  const { isPinned } = useConversationIsPinned({
    conversationTopic,
  });

  const { pinOrUnpinConversationAsync } = usePinOrUnpinConversation({
    conversationTopic,
  });

  return {
    actionKey: "pin",
    actionTitle: translate(isPinned ? "unpin" : "pin"),
    icon: {
      iconType: "SYSTEM",
      iconValue: isPinned ? "pin.slash" : "pin",
    },
    onPress: async () => {
      try {
        await pinOrUnpinConversationAsync();
      } catch (error) {
        captureErrorWithToast(error);
      }
    },
  } satisfies IUseContextMenuItem;
}

function useConversationContextMenuReadItem(args: {
  conversationTopic: ConversationTopic;
}): IUseContextMenuItem {
  const { conversationTopic } = args;

  const { isUnread } = useConversationIsUnread({
    topic: conversationTopic,
  });

  const { toggleReadStatusAsync } = useToggleReadStatus({
    topic: conversationTopic,
  });

  return {
    actionKey: "markAsUnread",
    actionTitle: isUnread
      ? translate("mark_as_read")
      : translate("mark_as_unread"),
    icon: {
      iconType: "SYSTEM",
      iconValue: isUnread ? "checkmark.message" : "message.badge",
    },
    onPress: toggleReadStatusAsync,
  } satisfies IUseContextMenuItem;
}

function useConversationContextMenuDeleteItem(args: {
  conversationTopic: ConversationTopic;
}): IUseContextMenuItem {
  const { conversationTopic } = args;

  const { theme } = useAppTheme();

  const conversation = useConversationByTopic(conversationTopic);

  const handleDeleteFn = conversation
    ? isConversationGroup(conversation)
      ? // eslint-disable-next-line react-hooks/rules-of-hooks
        useDeleteGroup({ groupTopic: conversationTopic })
      : // eslint-disable-next-line react-hooks/rules-of-hooks
        useDeleteDm(conversation)
    : () => null;

  return {
    actionKey: "delete",
    actionTitle: translate("delete"),
    icon: {
      iconType: "SYSTEM",
      iconValue: iconRegistry["trash"],
      iconTint: theme.colors.global.caution,
    },
    menuAttributes: ["destructive"],
    onPress: handleDeleteFn,
  } satisfies IUseContextMenuItem;
}
