import { useCallback } from "react"
import { IContextMenuViewProps, IMenuActionConfig } from "@/design-system/context-menu/context-menu"
import { iconRegistry } from "@/design-system/Icon/Icon"
import { VStack } from "@/design-system/VStack"
import { useConversationIsPinned } from "@/features/conversation/conversation-list/hooks/use-conversation-is-pinned"
import { useConversationIsUnread } from "@/features/conversation/conversation-list/hooks/use-conversation-is-unread"
import { useDeleteDm } from "@/features/conversation/conversation-list/hooks/use-delete-dm"
import { useDeleteGroup } from "@/features/conversation/conversation-list/hooks/use-delete-group"
import { useToggleReadStatus } from "@/features/conversation/conversation-list/hooks/use-toggle-read-status"
import { ConversationPreview } from "@/features/conversation/conversation-preview/conversation-preview"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"
import { translate } from "@/i18n"
import { useAppTheme } from "@/theme/use-app-theme"
import { captureErrorWithToast } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"
import { Haptics } from "@/utils/haptics"
import { usePinOrUnpinConversation } from "./use-pin-or-unpin-conversation"

// Specific hook for DM conversations
export function useDmConversationContextMenuViewProps(args: {
  xmtpConversationId: IXmtpConversationId
}) {
  const { xmtpConversationId } = args
  const deleteMenuItem = useDmDeleteMenuItem({ xmtpConversationId })

  return useBaseConversationContextMenuViewProps({
    xmtpConversationId,
    deleteMenuItem,
  })
}

// Specific hook for Group conversations
export function useGroupConversationContextMenuViewProps(args: {
  xmtpConversationId: IXmtpConversationId
}) {
  const { xmtpConversationId } = args
  const deleteMenuItem = useGroupDeleteMenuItem({ xmtpConversationId })

  return useBaseConversationContextMenuViewProps({
    xmtpConversationId,
    deleteMenuItem,
  })
}

// Base hook with shared functionality
function useBaseConversationContextMenuViewProps(args: {
  xmtpConversationId: IXmtpConversationId
  deleteMenuItem: IUseContextMenuItemArgs
}) {
  const { xmtpConversationId, deleteMenuItem } = args
  const { theme } = useAppTheme()

  const pinMenuItem = useConversationContextMenuPinItem({ xmtpConversationId })
  const readMenuItem = useConversationContextMenuReadItem({
    xmtpConversationId,
  })

  const menuItems = [pinMenuItem, readMenuItem, deleteMenuItem]

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
          <ConversationPreview xmtpConversationId={xmtpConversationId} />
        </VStack>
      )
    },
    onPressMenuItem: (event) => {
      Haptics.selectionAsync()
      const action = menuItems.find((item) => item.actionKey === event.nativeEvent.actionKey)
      if (action) {
        action.onPress()
      } else {
        console.warn("No action found for", event.nativeEvent.actionKey)
      }
    },
    onPressMenuPreview: () => {
      // TODO
    },
  } satisfies Partial<IContextMenuViewProps>
}

type IUseContextMenuItemArgs = IMenuActionConfig & { onPress: () => void }

function useConversationContextMenuPinItem(args: {
  xmtpConversationId: IXmtpConversationId
}): IUseContextMenuItemArgs {
  const { xmtpConversationId } = args

  const { isPinned } = useConversationIsPinned({
    xmtpConversationId,
  })

  const { pinOrUnpinConversationAsync } = usePinOrUnpinConversation({
    xmtpConversationId,
  })

  return {
    actionKey: "pin",
    actionTitle: translate(isPinned ? "unpin" : "pin"),
    icon: {
      iconType: "SYSTEM",
      iconValue: isPinned ? "pin.slash" : "pin",
    },
    onPress: async () => {
      try {
        await pinOrUnpinConversationAsync()
      } catch (error) {
        captureErrorWithToast(
          new GenericError({ error, additionalMessage: "Error pinning conversation" }),
        )
      }
    },
  } satisfies IUseContextMenuItemArgs
}

function useConversationContextMenuReadItem(args: {
  xmtpConversationId: IXmtpConversationId
}): IUseContextMenuItemArgs {
  const { xmtpConversationId } = args

  const { isUnread } = useConversationIsUnread({
    xmtpConversationId,
  })

  const { toggleReadStatusAsync } = useToggleReadStatus({
    xmtpConversationId,
  })

  return {
    actionKey: "markAsUnread",
    actionTitle: isUnread ? translate("mark_as_read") : translate("mark_as_unread"),
    icon: {
      iconType: "SYSTEM",
      iconValue: isUnread ? "checkmark.message" : "message.badge",
    },
    onPress: toggleReadStatusAsync,
  } satisfies IUseContextMenuItemArgs
}

function useBaseDeleteMenuItem({ onDelete }: { onDelete: () => Promise<void> }) {
  const { theme } = useAppTheme()

  return {
    actionKey: "delete",
    actionTitle: translate("delete"),
    icon: {
      iconType: "SYSTEM",
      iconValue: iconRegistry["trash"],
      iconTint: theme.colors.global.caution,
    },
    menuAttributes: ["destructive"],
  } satisfies Omit<IUseContextMenuItemArgs, "onPress">
}

function useGroupDeleteMenuItem({
  xmtpConversationId,
}: {
  xmtpConversationId: IXmtpConversationId
}) {
  const deleteGroup = useDeleteGroup({ xmtpConversationId })

  const handleDelete = useCallback(async () => {
    try {
      await deleteGroup()
    } catch (error) {
      captureErrorWithToast(new GenericError({ error, additionalMessage: "Error deleting group" }))
    }
  }, [deleteGroup])

  return {
    ...useBaseDeleteMenuItem({ onDelete: handleDelete }),
    onPress: handleDelete,
  } satisfies IUseContextMenuItemArgs
}

function useDmDeleteMenuItem({ xmtpConversationId }: { xmtpConversationId: IXmtpConversationId }) {
  const deleteDm = useDeleteDm({ xmtpConversationId })

  const handleDelete = useCallback(async () => {
    try {
      deleteDm()
    } catch (error) {
      captureErrorWithToast(
        new GenericError({ error, additionalMessage: "Error deleting conversation" }),
      )
    }
  }, [deleteDm])

  return {
    ...useBaseDeleteMenuItem({ onDelete: handleDelete }),
    onPress: handleDelete,
  } satisfies IUseContextMenuItemArgs
}
