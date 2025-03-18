import { translate } from "@i18n/index"
import React from "react"
import { Screen } from "@/components/screen/screen"
import { EmptyState } from "@/design-system/empty-state"
import { useBlockedConversationsForCurrentAccount } from "@/features/blocked-conversations/use-blocked-conversations-for-current-account"
import { ConversationList } from "@/features/conversation/conversation-list/conversation-list.component"
import { useHeader } from "@/navigation/use-header"
import { useRouter } from "@/navigation/use-navigation"
import { $globalStyles } from "@/theme/styles"

export function BlockedConversationsScreen() {
  const { data: blockedConversationsIds = [] } = useBlockedConversationsForCurrentAccount()

  const router = useRouter()

  useHeader({
    safeAreaEdges: ["top"],
    onBack: () => router.goBack(),
    titleTx: "removed_chats.removed_chats",
  })

  return (
    <Screen contentContainerStyle={$globalStyles.flex1}>
      {blockedConversationsIds.length > 0 ? (
        <ConversationList conversationsIds={blockedConversationsIds} />
      ) : (
        <EmptyState
          title={translate("removed_chats.eyes")}
          description={translate("removed_chats.no_removed_chats")}
        />
      )}
    </Screen>
  )
}
