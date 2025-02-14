## SpecStory

## Optimizing React with useMemo (1/17/2025, 10:40:50 AM)

_**User**_

use some useMemo to make it cleaner

---

_**Assistant**_

I'll help optimize the code using `useMemo` for derived values. Here are the suggested changes:

```typescript:features/conversation-list/conversation-list-awaiting-requests.tsx
// ... existing code ...

export const ConversationListAwaitingRequests = memo(
  function ConversationListAwaitingRequests() {
    const { theme } = useAppTheme();
    const currentAccount = useCurrentAccount()!;
    const navigation = useNavigation();
    const { likelyNotSpam, isLoading } = useConversationRequestsListItem();
    const { data: currentAccountInboxId } = useCurrentAccountInboxId();

    // Memoize queries to prevent unnecessary recalculations
    const conversationsMetadataQueries = useQueries({
      queries: useMemo(
        () =>
          (likelyNotSpam ?? []).map((conversation) =>
            getConversationMetadataQueryOptions({
              account: currentAccount!,
              topic: conversation.topic,
            })
          ),
        [likelyNotSpam, currentAccount]
      ),
    });

    // Memoize derived values
    const numberOfRequestsLikelyNotSpam = useMemo(
      () => likelyNotSpam.length,
      [likelyNotSpam]
    );

    const hasUnreadMessages = useMemo(
      () =>
        conversationsMetadataQueries.some((query, index) => {
          const conversation = likelyNotSpam[index];
          return conversationIsUnreadForInboxId({
            lastMessageSent: conversation.lastMessage?.sentNs ?? null,
            lastMessageSenderInboxId:
              conversation.lastMessage?.senderInboxId ?? null,
            consumerInboxId: currentAccountInboxId!,
            markedAsUnread: query.data?.markedAsUnread ?? false,
            readUntil: query.data?.readUntil ?? 0,
          });
        }),
      [conversationsMetadataQueries, likelyNotSpam, currentAccountInboxId]
    );

    // Memoize title component to prevent unnecessary rerenders
    const title = useMemo(
      () => (
        <HStack
          style={{
            alignItems: "center",
            columnGap: theme.spacing.xxs,
          }}
        >
          <ConversationListItemTitle>Requests</ConversationListItemTitle>
          {isLoading && (
            <AnimatedCenter
              entering={theme.animation.reanimatedFadeInScaleIn()}
              exiting={theme.animation.reanimatedFadeOutScaleOut()}
            >
              <Loader size="small" />
            </AnimatedCenter>
          )}
        </HStack>
      ),
      [theme, isLoading]
    );

    // Memoize subtitle component
    const subtitle = useMemo(
      () =>
        isLoading ? null : (
          <AnimatedHStack
            entering={theme.animation.reanimatedFadeInSpring}
            exiting={theme.animation.reanimatedFadeOutSpring}
          >
            <ConversationListItemSubtitle>
              {numberOfRequestsLikelyNotSpam === 0
                ? "All clear"
                : `${numberOfRequestsLikelyNotSpam} new contact${
                    numberOfRequestsLikelyNotSpam > 1 ? "s" : ""
                  }`}
            </ConversationListItemSubtitle>
          </AnimatedHStack>
        ),
      [theme, isLoading, numberOfRequestsLikelyNotSpam]
    );

    // ... rest of the code ...
```

I've made the following optimizations:
1. Memoized the queries array to prevent unnecessary recreations
2. Memoized `numberOfRequestsLikelyNotSpam` since it's used in multiple places
3. Memoized `hasUnreadMessages` calculation to prevent recalculation on every render
4. Memoized the `title` and `subtitle` components to prevent unnecessary rerenders
5. Added appropriate dependencies to each `useMemo` hook

These changes will help reduce unnecessary recalculations and rerenders, especially when the component's props or state change but the derived values remain the same.

---



---

