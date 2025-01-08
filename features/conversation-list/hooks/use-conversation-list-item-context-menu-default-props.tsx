import { useCurrentAccount } from "@/data/store/accountsStore";
import { VStack } from "@/design-system/VStack";
import { useConversationListConversation } from "@/features/conversation-list/hooks/use-conversation-list-conversation";
import { useHandleDeleteDm } from "@/features/conversation-list/hooks/useHandleDeleteDm";
import { useHandleDeleteGroup } from "@/features/conversation-list/hooks/useHandleDeleteGroup";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/useMessageIsUnread";
import { useToggleReadStatus } from "@/features/conversation-list/hooks/useToggleReadStatus";
import {
  useConversationListStoreActions,
  useConversationListStoreForCurrentAccount,
} from "@/features/conversation-list/stores/conversation-list.store";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { translate } from "@/i18n";
import { ConversationReadOnly } from "@/screens/ConversationReadOnly";
import { useAppTheme } from "@/theme/useAppTheme";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import {
  ContextMenuViewProps,
  MenuActionConfig,
} from "react-native-ios-context-menu";

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
      backgroundColor: "white",
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

  const pinnedConversationTopics = useConversationListStoreForCurrentAccount(
    (s) => s.pinnedConversationTopics
  );

  const conversationListStoreActions = useConversationListStoreActions();

  const isPinned = pinnedConversationTopics.includes(conversationTopic);

  return {
    actionKey: "pin",
    actionTitle: translate(isPinned ? "unpin" : "pin"),
    icon: {
      iconType: "SYSTEM",
      iconValue: "pin",
    },
    onPress: () => {
      if (isPinned) {
        conversationListStoreActions.setPinnedConversationTopics(
          pinnedConversationTopics.filter(
            (topic: string) => topic !== conversationTopic
          )
        );
      } else {
        conversationListStoreActions.setPinnedConversationTopics([
          ...pinnedConversationTopics,
          conversationTopic,
        ]);
      }
    },
  } satisfies IUseContextMenuItem;
}

function useConversationContextMenuReadItem(args: {
  conversationTopic: ConversationTopic;
}): IUseContextMenuItem {
  const { conversationTopic } = args;

  const conversation = useConversationListConversation(conversationTopic);

  const isUnread = useConversationIsUnread({
    topic: conversationTopic,
    lastMessage: conversation?.lastMessage,
    timestampNs: conversation?.lastMessage?.sentNs ?? 0,
  });

  const currentAccount = useCurrentAccount();

  const toggleReadStatus = useToggleReadStatus({
    topic: conversationTopic,
    isUnread,
    currentAccount: currentAccount!,
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
    onPress: toggleReadStatus,
  } satisfies IUseContextMenuItem;
}

function useConversationContextMenuDeleteItem(args: {
  conversationTopic: ConversationTopic;
}): IUseContextMenuItem {
  const { conversationTopic } = args;

  const { theme } = useAppTheme();

  const conversation = useConversationListConversation(conversationTopic);

  const handleDeleteFn = conversation
    ? isConversationGroup(conversation)
      ? // eslint-disable-next-line react-hooks/rules-of-hooks
        useHandleDeleteGroup(conversation)
      : // eslint-disable-next-line react-hooks/rules-of-hooks
        useHandleDeleteDm(conversation)
    : () => null;

  return {
    actionKey: "delete",
    actionTitle: translate("delete"),
    icon: {
      iconType: "SYSTEM",
      iconValue: "trash",
      iconTint: theme.colors.global.caution,
    },
    menuAttributes: ["destructive"],
    onPress: handleDeleteFn,
  } satisfies IUseContextMenuItem;
}
