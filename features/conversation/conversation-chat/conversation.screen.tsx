import { NativeStackScreenProps } from "@react-navigation/native-stack"
import React, { memo, useCallback, useEffect, useRef } from "react"
import { TextInput as RNTextInput } from "react-native"
import { Screen } from "@/components/screen/screen"
import { ActivityIndicator } from "@/design-system/activity-indicator"
import { Center } from "@/design-system/Center"
import { VStack } from "@/design-system/VStack"
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store"
import { ConversationComposer } from "@/features/conversation/conversation-chat/conversation-composer/conversation-composer"
import { ConversationComposerStoreProvider } from "@/features/conversation/conversation-chat/conversation-composer/conversation-composer.store-context"
import { ConversationKeyboardFiller } from "@/features/conversation/conversation-chat/conversation-keyboard-filler"
import { ConversationMessageContextMenu } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-context-menu/conversation-message-context-menu"
import { ConversationMessageContextMenuStoreProvider } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-context-menu/conversation-message-context-menu.store-context"
import { MessageReactionsDrawer } from "@/features/conversation/conversation-chat/conversation-message/conversation-message-reactions/conversation-message-reaction-drawer/conversation-message-reaction-drawer"
import { getConversationMessagesQueryOptions } from "@/features/conversation/conversation-chat/conversation-messages.query"
import { DmConversationTitle } from "@/features/conversation/conversation-chat/conversation-screen-header/conversation-screen-dm-header-title"
import { GroupConversationTitle } from "@/features/conversation/conversation-chat/conversation-screen-header/conversation-screen-group-header-title"
import { ConversationCreateListResults } from "@/features/conversation/conversation-create/conversation-create-list-results"
import { useConversationQuery } from "@/features/conversation/conversation-query"
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm"
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group"
import { SearchUsersInput } from "@/features/search-users/search-users-input"
import { NavigationParamList } from "@/navigation/navigation.types"
import { useHeader } from "@/navigation/use-header"
import { useRouter } from "@/navigation/use-navigation"
import { $globalStyles } from "@/theme/styles"
import { useAppTheme } from "@/theme/use-app-theme"
import { useRefetchQueryOnRefocus } from "@/utils/react-query/use-refetch-query-on-focus"
import { ConversationMessages } from "./conversation-messages"
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

  const currentAccount = useCurrentSenderEthAddress()!
  const navigation = useRouter()
  const topic = useConversationStoreContext((state) => state.topic)
  const isCreatingNewConversation = useConversationStoreContext(
    (state) => state.isCreatingNewConversation,
  )

  const { data: conversation, isLoading: isLoadingConversation } = useConversationQuery({
    account: currentAccount,
    topic: topic!, // ! is okay because we have enabled in useQuery
    caller: "Conversation screen",
  })

  useRefetchQueryOnRefocus(
    topic
      ? getConversationMessagesQueryOptions({ account: currentAccount, topic }).queryKey
      : undefined,
  )

  useHeader(
    {
      onBack: () => navigation.goBack(),
      safeAreaEdges: ["top"],
      // DM params
      ...(!isCreatingNewConversation &&
        conversation &&
        isConversationDm(conversation) && {
          titleComponent: <DmConversationTitle topic={conversation.topic} />,
        }),
      // Group params
      ...(!isCreatingNewConversation &&
        conversation &&
        isConversationGroup(conversation) && {
          titleComponent: <GroupConversationTitle conversationTopic={conversation.topic} />,
        }),
      // New conversation params
      ...(isCreatingNewConversation && {
        title: "New chat",
        withBottomBorder: true,
      }),
    },
    [conversation, isCreatingNewConversation],
  )

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
