## SpecStory

## Code Component Reorganization for Clarity (1/13/2025, 9:30:15 AM)

_**User**_

How do you think I can format this to have some components in new files and have it easy to consume for others

---

_**Assistant**_

I'll help you reorganize this file to make it more maintainable. Here's how we can break it down into separate files:

1. First, let's create separate files for the list item components:

```typescript:features/conversation-list/components/conversation-list-dm.tsx
import { memo } from 'react';
import { ContextMenuView } from "react-native-ios-context-menu";
import { DmWithCodecsType } from "@/utils/xmtpRN/client.types";
import { V3DMListItem } from "./conversation-list-item/V3DMListItem";
import { useAppTheme } from "@/theme/useAppTheme";
import { useConversationContextMenuViewDefaultProps } from "../hooks/use-conversation-list-item-context-menu-default-props";

type IConversationListDmProps = {
  dm: DmWithCodecsType;
};

export const ConversationListDm = memo(function ConversationListDm(props: IConversationListDmProps) {
  const { dm } = props;
  const { theme } = useAppTheme();
  const contextMenuProps = useConversationContextMenuViewDefaultProps({
    conversationTopic: dm.topic,
  });

  return (
    <ContextMenuView hitSlop={theme.spacing.xs} {...contextMenuProps}>
      <V3DMListItem conversation={dm} />
    </ContextMenuView>
  );
});
```

```typescript:features/conversation-list/components/conversation-list-group.tsx
import { memo } from 'react';
import { ContextMenuView } from "react-native-ios-context-menu";
import { GroupWithCodecsType } from "@/utils/xmtpRN/client.types";
import { V3GroupConversationListItem } from "./conversation-list-item/V3GroupConversationListItem";
import { useAppTheme } from "@/theme/useAppTheme";
import { useConversationContextMenuViewDefaultProps } from "../hooks/use-conversation-list-item-context-menu-default-props";

type IConversationListGroupProps = {
  group: GroupWithCodecsType;
};

export const ConversationListGroup = memo(function ConversationListGroup(props: IConversationListGroupProps) {
  const { group } = props;
  const { theme } = useAppTheme();
  const contextMenuProps = useConversationContextMenuViewDefaultProps({
    conversationTopic: group.topic,
  });

  return (
    <ContextMenuView hitSlop={theme.spacing.xs} {...contextMenuProps}>
      <V3GroupConversationListItem group={group} />
    </ContextMenuView>
  );
});
```

2. Create a separate file for the list header components:

```typescript:features/conversation-list/components/list-header/list-header.tsx
import React, { memo } from 'react';
import { TouchableOpacity, useColorScheme } from "react-native";
import { VStack } from "@/design-system/VStack";
import { Text } from "@/design-system/Text";
import { translate } from "@/i18n";
import { useAppTheme } from "@/theme/useAppTheme";
import { useSettingsStore } from "@/data/store/accountsStore";
import { useSelect } from "@/data/store/storeHelpers";
import { useDisconnectActionSheet } from "@hooks/useDisconnectActionSheet";
import { useConversationListStyles } from "../../conversation-list.styles";
import { States } from "./states";
import { ConversationListPinnedConversations } from "../../PinnedConversations/PinnedConversations";
import { ConversationListRequestsListItem } from "../conversation-list-requests-list-item";

export const ListHeader = React.memo(function ListHeader() {
  const { ephemeralAccount } = useSettingsStore(useSelect(["ephemeralAccount"]));

  return (
    <VStack>
      <States />
      {ephemeralAccount && <EphemeralAccountBanner />}
      <ConversationListPinnedConversations />
      <ConversationListRequestsListItem />
    </VStack>
  );
});

const EphemeralAccountBanner = memo(function EphemeralAccountBanner() {
  const { theme } = useAppTheme();
  const colorScheme = useColorScheme();
  const showDisconnectActionSheet = useDisconnectActionSheet();
  const { screenHorizontalPadding } = useConversationListStyles();

  return (
    <TouchableOpacity
      onPress={() => showDisconnectActionSheet(colorScheme)}
      style={{
        width: "100%",
        backgroundColor: theme.colors.background.blurred,
        paddingHorizontal: screenHorizontalPadding,
        paddingVertical: theme.spacing.xs,
      }}
    >
      <VStack>
        <Text size="xs">
          {translate("ephemeral_account_banner.title")}.{" "}
          {translate("ephemeral_account_banner.subtitle")}
        </Text>
      </VStack>
    </TouchableOpacity>
  );
});
```

3. Create a hook for the conversation list data:

```typescript:features/conversation-list/hooks/use-conversation-list-items.ts
import { useMemo } from 'react';
import { useCurrentAccount, useChatStore } from "@/data/store/accountsStore";
import { useSelect } from "@/data/store/storeHelpers";
import { useConversationListQuery } from "@/queries/useConversationListQuery";
import { useConversationListStoreForCurrentAccount } from "../stores/conversation-list.store";
import { isConversationAllowed } from "@/features/conversation/utils/is-conversation-allowed";

export function useConversationListItems() {
  const currentAccount = useCurrentAccount();

  const { data: conversations, ...rest } = useConversationListQuery({
    account: currentAccount!,
    context: "conversation-list-screen",
  });

  const { topicsData } = useChatStore(useSelect(["topicsData"]));

  const pinnedConversationTopics = useConversationListStoreForCurrentAccount(
    (s) => s.pinnedConversationTopics
  );

  const conversationsFiltered = useMemo(() => {
    const pinnedTopics = new Set(pinnedConversationTopics);
    const deletedTopics = new Set(
      Object.entries(topicsData)
        .filter(([_, data]) => data?.status === "deleted")
        .map(([topic]) => topic)
    );

    return conversations?.filter((conversation) => {
      const isAllowed = isConversationAllowed(conversation);
      const isNotPinned = !pinnedTopics.has(conversation.topic);
      const isNotDeleted = !deletedTopics.has(conversation.topic);

      return isAllowed && isNotPinned && isNotDeleted;
    });
  }, [conversations, pinnedConversationTopics, topicsData]);

  return { data: conversationsFiltered, ...rest };
}
```

4. Then, the main screen file becomes much cleaner:

```typescript:features/conversation-list/conversation-list.screen.tsx
import React, { useCallback } from "react";
import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { ConversationList } from "./components/conversation-list/conversation-list";
import { ConversationListEmpty } from "./components/conversation-list-empty";
import { ListHeader } from "./components/list-header/list-header";
import { ConversationListDm } from "./components/conversation-list-dm";
import { ConversationListGroup } from "./components/conversation-list-group";
import { useConversationListItems } from "./hooks/use-conversation-list-items";
import { useHeaderWrapper } from "./conversation-list.screen-header";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { $globalStyles } from "@/theme/styles";
import { captureError } from "@/utils/capture-error";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { NavigationParamList } from "@/screens/Navigation/Navigation";

type IConversationListProps = NativeStackScreenProps<NavigationParamList, "Chats">;

export function ConversationListScreen(props: IConversationListProps) {
  const {
    data: conversations,
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = useConversationListItems();

  const insets = useSafeAreaInsets();
  useHeaderWrapper();

  const handleRefresh = useCallback(async () => {
    try {
      await refetchConversations();
    } catch (error) {
      captureError(error);
    }
  }, [refetchConversations]);

  return (
    <Screen contentContainerStyle={$globalStyles.flex1}>
      <ConversationList
        conversations={isLoadingConversations ? [] : (conversations ?? [])}
        scrollEnabled={conversations && conversations?.length > 0}
        ListEmptyComponent={<ConversationListEmpty />}
        ListHeaderComponent={<ListHeader />}
        onRefetch={handleRefresh}
        contentContainerStyle={{
          paddingBottom: insets.bottom,
        }}
        renderConversation={({ item }) => {
          if (isConversationGroup(item)) {
            return <ConversationListGroup group={item} />;
          }
          return <ConversationListDm dm={item} />;
        }}
      />
    </Screen>
  );
}
```

This reorganization:
1. Separates concerns into individual files
2. Makes the code more maintainable and easier to test
3. Follows the single responsibility principle
4. Makes it easier for other developers to find and modify specific components
5. Keeps related code together
6. Makes the main screen file much more focused and easier to understand

The new structure would look like:
```
features/conversation-list/
├── components/
│   ├── conversation-list-dm.tsx
│   ├── conversation-list-group.tsx
│   ├── list-header/
│   │   ├── list-header.tsx
│   │   └── states.tsx
├── hooks/
│   └── use-conversation-list-items.ts
└── conversation-list.screen.tsx
```

---



---

