import { NativeStackScreenProps } from "@react-navigation/native-stack"
import React, { memo, useCallback, useEffect, useRef } from "react"
import { TextInput as RNTextInput } from "react-native"
import { Screen } from "@/components/screen/screen"
import { ActivityIndicator } from "@/design-system/activity-indicator"
import { Center } from "@/design-system/Center"
import { VStack } from "@/design-system/VStack"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { ConversationComposer } from "@/features/conversation/conversation-chat/conversation-composer/conversation-composer"
import { ConversationComposerStoreProvider } from "@/features/conversation/conversation-chat/conversation-composer/conversation-composer.store-context"
import { ConversationKeyboardFiller } from "@/features/conversation/conversation-chat/conversation-keyboard-filler.component"
import { ConversationMessageContextMenu } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-context-menu/conversation-message-context-menu"
import { ConversationMessageContextMenuStoreProvider } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-context-menu/conversation-message-context-menu.store-context"
import { MessageReactionsDrawer } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-reactions/conversation-message-reaction-drawer/conversation-message-reaction-drawer"
import { getConversationMessagesQueryOptions } from "@/features/conversation/conversation-chat/conversation-messages.query"
import { useConversationScreenHeader } from "@/features/conversation/conversation-chat/conversation.screen-header"
import { ConversationCreateListResults } from "@/features/conversation/conversation-create/conversation-create-list-results"
import { useConversationQuery } from "@/features/conversation/queries/conversation.query"
import { SearchUsersInput } from "@/features/search-users/search-users-input"
import { NavigationParamList } from "@/navigation/navigation.types"
import { useRouter } from "@/navigation/use-navigation"
import { $globalStyles } from "@/theme/styles"
import { useAppTheme } from "@/theme/use-app-theme"
import { useRefetchQueryOnRefocus } from "@/utils/react-query/use-refetch-query-on-focus"
import { ConversationMessages } from "./conversation-messages.component"
import {
  ConversationStoreProvider,
  useConversationStore,
  useConversationStoreContext,
} from "./conversation.store-context"

export const ConversationScreen = memo(function ConversationScreen(
  props: NativeStackScreenProps<NavigationParamList, "Conversation">,
) {
  const {
    topic,
    composerTextPrefill = "",
    searchSelectedUserInboxIds = [],
    isNew = false,
  } = props.route.params

  return (
    <Screen contentContainerStyle={$globalStyles.flex1}>
      <ConversationStoreProvider
        topic={topic ?? null}
        isCreatingNewConversation={isNew}
        searchSelectedUserInboxIds={searchSelectedUserInboxIds}
      >
        <ConversationMessageContextMenuStoreProvider>
          <ConversationComposerStoreProvider inputValue={composerTextPrefill}>
            <Content />
          </ConversationComposerStoreProvider>
        </ConversationMessageContextMenuStoreProvider>
      </ConversationStoreProvider>
    </Screen>
  )
})

const Content = memo(function Content() {
  const { theme } = useAppTheme()

  const currentSender = useSafeCurrentSender()
  const topic = useConversationStoreContext((state) => state.topic)
  const isCreatingNewConversation = useConversationStoreContext(
    (state) => state.isCreatingNewConversation,
  )

  const { data: conversation, isLoading: isLoadingConversation } = useConversationQuery({
    inboxId: currentSender.inboxId,
    topic: topic!, // ! is okay because we have enabled in useQuery
    caller: "Conversation screen",
  })

  useRefetchQueryOnRefocus(
    topic
      ? getConversationMessagesQueryOptions({ clientInboxId: currentSender.inboxId, topic })
          .queryKey
      : undefined,
  )

  useConversationScreenHeader()

  if (isLoadingConversation) {
    return (
      <Center style={$globalStyles.flex1}>
        <ActivityIndicator />
      </Center>
    )
  }

  return (
    <>
      <VStack style={$globalStyles.flex1}>
        {isCreatingNewConversation && <ConversationCreateSearchInputWrapper />}

        <VStack style={$globalStyles.flex1}>
          {isCreatingNewConversation && <ConversationCreateListResults />}
          {conversation ? (
            <ConversationMessages conversation={conversation} />
          ) : (
            <VStack style={$globalStyles.flex1} />
          )}
          <ConversationComposer />
          <ConversationKeyboardFiller />
        </VStack>
      </VStack>
      <ConversationMessageContextMenu />
      <MessageReactionsDrawer />
    </>
  )
})

const ConversationCreateSearchInputWrapper = memo(function ConversationCreateSearchInputWrapper() {
  const inputRef = useRef<RNTextInput | null>(null)

  const selectedSearchUserInboxIds = useConversationStoreContext(
    (state) => state.searchSelectedUserInboxIds,
  )
  const conversationStore = useConversationStore()

  const handleSearchTextChange = useCallback(
    (text: string) => {
      conversationStore.setState({ searchTextValue: text })
    },
    [conversationStore],
  )

  const handleSelectedInboxIdsChange = useCallback(
    (inboxIds: string[]) => {
      conversationStore.setState({ searchSelectedUserInboxIds: inboxIds })
    },
    [conversationStore],
  )

  //
  useEffect(() => {
    conversationStore.subscribe(
      (state) => state.searchTextValue,
      (searchTextValue) => {
        if (searchTextValue === "") {
          inputRef.current?.clear()
        }
      },
    )
  }, [conversationStore])

  return (
    <SearchUsersInput
      inputRef={inputRef}
      searchSelectedUserInboxIds={selectedSearchUserInboxIds}
      onSearchTextChange={handleSearchTextChange}
      onSelectedInboxIdsChange={handleSelectedInboxIdsChange}
    />
  )
})

export const DmConversationEmpty = memo(function DmConversationEmpty() {
  // Will never really be empty anyway because to create the DM conversation the user has to send a first message
  return null
})

export const GroupConversationEmpty = memo(() => {
  // Will never really be empty anyway becaue we have group updates
  return null
})
