import { useFocusEffect } from "@react-navigation/native"
import { memo, useCallback, useState } from "react"
import { Screen } from "@/components/screen/screen"
import { ConversationList } from "@/features/conversation/conversation-list/conversation-list.component"
import { ConversationRequestsToggle } from "@/features/conversation/conversation-requests-list/conversation-requests-list-toggle"
import { useConversationRequestsListScreenHeader } from "@/features/conversation/conversation-requests-list/conversation-requests-list.screen-header"
import { useBetterFocusEffect } from "@/hooks/use-better-focus-effect"
import { translate } from "@/i18n"
import { $globalStyles } from "@/theme/styles"
import { captureError } from "@/utils/capture-error"
import { useConversationRequestsListItem } from "./use-conversation-requests-list-items"

export const ConversationRequestsListScreen = memo(function () {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useConversationRequestsListScreenHeader()

  const handleToggleSelect = useCallback((index: number) => {
    setSelectedIndex(index)
  }, [])

  return (
    <Screen contentContainerStyle={$globalStyles.flex1}>
      <ConversationRequestsToggle
        options={[translate("You might know"), translate("Hidden")]}
        selectedIndex={selectedIndex}
        onSelect={handleToggleSelect}
      />

      <ConversationListWrapper selectedIndex={selectedIndex} />
    </Screen>
  )
})

const ConversationListWrapper = memo(function ConversationListWrapper({
  selectedIndex,
}: {
  selectedIndex: number
}) {
  const { likelyNotSpamConversationIds, likelySpamConversationIds, refetch } =
    useConversationRequestsListItem()

  useBetterFocusEffect(
    useCallback(() => {
      refetch().catch(captureError)
    }, [refetch]),
  )

  return (
    <ConversationList
      conversationsIds={
        selectedIndex === 0 ? likelyNotSpamConversationIds : likelySpamConversationIds
      }
    />
  )
})
