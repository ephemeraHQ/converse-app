## SpecStory

## Refactoring React Hook for Clean Code (1/14/2025, 1:09:45 PM)

_**User**_

how can we make it cleaner. I don't like the useeffect and having function in the use efect...

---

_**Assistant**_

I'll help you clean up the code by extracting the processing logic outside of the useEffect and making it more functional. Here's the improved version:

```typescript:features/conversation-requests-list/conversation-requests-list.screen.tsx
// ... existing imports ...

type ProcessedConversation = {
  conversation: ConversationWithCodecsType;
  isSpam: boolean;
} | null;

const getMessageContent = (lastMessage: any): string => {
  try {
    const decodedContent = lastMessage.content() ?? lastMessage.fallback ?? "";
    return typeof decodedContent === "string" ? decodedContent : (lastMessage.fallback ?? "");
  } catch {
    return lastMessage.fallback ?? "";
  }
};

const processConversation = async (
  conversation: ConversationWithCodecsType
): Promise<ProcessedConversation> => {
  if (conversation.state !== "unknown" || !conversation.lastMessage) {
    return null;
  }

  const content = getMessageContent(conversation.lastMessage);
  const contentType = getMessageContentType(conversation.lastMessage.contentTypeId!);
  
  let spamScore = 0;
  try {
    if (contentType) {
      spamScore = await getV3SpamScore({ message: content, contentType });
    }
  } catch (error) {
    logger.error("Couldn't get spam score", error);
  }

  return {
    conversation,
    isSpam: spamScore > 1,
  };
};

const categorizeConversations = async (conversations: ConversationWithCodecsType[] = []) => {
  const results = await Promise.allSettled(conversations.map(processConversation));
  
  return results.reduce<{ notSpam: ConversationWithCodecsType[]; spam: ConversationWithCodecsType[] }>(
    (acc, result) => {
      if (result.status === "fulfilled" && result.value) {
        const { conversation, isSpam } = result.value;
        if (isSpam) {
          acc.spam.push(conversation);
        } else {
          acc.notSpam.push(conversation);
        }
      }
      return acc;
    },
    { notSpam: [], spam: [] }
  );
};

const useRequestsConversations = () => {
  const currentAccount = useCurrentAccount();
  const [likelyNotSpam, setLikelyNotSpam] = useState<ConversationWithCodecsType[]>([]);
  const [likelySpam, setLikelySpam] = useState<ConversationWithCodecsType[]>([]);

  const { data: conversations, ...rest } = useConversationListQuery({
    account: currentAccount!,
    context: "useRequestsConversations",
  });

  useEffect(() => {
    categorizeConversations(conversations).then(({ notSpam, spam }) => {
      setLikelyNotSpam(notSpam);
      setLikelySpam(spam);
    });
  }, [conversations]);

  return { likelyNotSpam, likelySpam, ...rest };
};
```

Key improvements made:

1. Extracted helper functions outside the hook and effect
2. Added proper typing with `ProcessedConversation`
3. Separated message content extraction into its own function
4. Simplified the categorization logic using `reduce`
5. Made the code more functional and easier to test
6. Removed nested function declarations
7. Improved readability with smaller, focused functions

The useEffect is still necessary because we need to handle side effects (async operations and state updates) when conversations change, but it's now much cleaner and only handles the high-level flow.

---



---

