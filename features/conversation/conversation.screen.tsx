import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { Center } from "@/design-system/Center";
import { VStack } from "@/design-system/VStack";
import { ActivityIndicator } from "@/design-system/activity-indicator";
import { ConversationComposer } from "@/features/conversation/conversation-composer/conversation-composer";
import { ConversationComposerStoreProvider } from "@/features/conversation/conversation-composer/conversation-composer.store-context";
import { ConversationCreateSearchInput } from "@/features/conversation/conversation-create/components/conversation-create-search-input";
import { ConversationSearchResultsList } from "@/features/conversation/conversation-create/components/conversation-create-search-results-list";
import { ConversationKeyboardFiller } from "@/features/conversation/conversation-keyboard-filler";
import { ConversationMessageContextMenu } from "@/features/conversation/conversation-message/conversation-message-context-menu/conversation-message-context-menu";
import { ConversationMessageContextMenuStoreProvider } from "@/features/conversation/conversation-message/conversation-message-context-menu/conversation-message-context-menu.store-context";
import { MessageReactionsDrawer } from "@/features/conversation/conversation-message/conversation-message-reactions/conversation-message-reaction-drawer/conversation-message-reaction-drawer";
import { DmConversationTitle } from "@/features/conversation/conversation-screen-header/conversation-screen-dm-header-title";
import { GroupConversationTitle } from "@/features/conversation/conversation-screen-header/conversation-screen-group-header-title";
import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { useHeader } from "@/navigation/use-header";
import { useConversationQuery } from "@/queries/conversation-query";
import { NavigationParamList } from "@/screens/Navigation/Navigation";
import { $globalStyles } from "@/theme/styles";
import { useAppTheme } from "@/theme/useAppTheme";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useRouter } from "@navigation/useNavigation";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { memo } from "react";
import { ConversationMessages } from "./conversation-messages";
import {
  ConversationStoreProvider,
  useConversationStoreContext,
} from "./conversation.store-context";

export const ConversationScreen = memo(function ConversationScreen(
  props: NativeStackScreenProps<NavigationParamList, "Conversation">
) {
  const {
    topic,
    composerTextPrefill = "",
    searchSelectedUserInboxIds = [],
    isNew = false,
  } = props.route.params;

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
  );
});

const Content = memo(function Content() {
  const { theme } = useAppTheme();

  const currentAccount = useCurrentAccount()!;
  const navigation = useRouter();
  const topic = useConversationStoreContext((state) => state.topic);
  const isCreatingNewConversation = useConversationStoreContext(
    (state) => state.isCreatingNewConversation
  );

  const { data: conversation, isLoading: isLoadingConversation } =
    useConversationQuery({
      account: currentAccount,
      topic: topic!, // ! is okay because we have enabled in useQuery
      caller: "Conversation screen",
    });

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
          titleComponent: (
            <GroupConversationTitle conversationTopic={conversation.topic} />
          ),
        }),
      // New conversation params
      ...(isCreatingNewConversation && {
        title: "New chat",
        style: {
          borderBottomWidth: theme.borderWidth.sm,
          borderBottomColor: theme.colors.border.subtle,
        },
      }),
    },
    [conversation, isCreatingNewConversation]
  );

  if (isLoadingConversation) {
    return (
      <Center style={$globalStyles.flex1}>
        <ActivityIndicator />
      </Center>
    );
  }

  return (
    <>
      <VStack style={$globalStyles.flex1}>
        {isCreatingNewConversation && <ConversationCreateSearchInput />}

        <VStack style={$globalStyles.flex1}>
          {isCreatingNewConversation && <ConversationSearchResultsList />}
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
  );
});

export const DmConversationEmpty = memo(function DmConversationEmpty() {
  // Will never really be empty anyway because to create the DM conversation the user has to send a first message
  return null;
});

export const GroupConversationEmpty = memo(() => {
  // Will never really be empty anyway becaue we have group updates
  return null;
});
