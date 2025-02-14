## SpecStory

## Custom Hook for Spam Classification in React Query (1/17/2025, 1:13:09 PM)

_**User**_

I want to put this logic with react-query so i was thinking a custom hook where we would use useQuery and the "getUnknownConsentConversationsQueryOptions" with useQuery to listen to new conversiatons and then the queryFn would go do what i'S processConverstaions right now meaning categorizing the likeSpam or notSpam

---

_**Assistant**_

I'll help you create a custom hook that uses React Query to handle both fetching conversations and processing them for spam classification. Here's how we can refactor this:

```typescript:features/conversation-requests-list/use-conversation-requests-list-items.tsx
import { getV3SpamScore } from "@/data/helpers/conversations/spamScore";
import { useCurrentAccount } from "@/data/store/accountsStore";
import { getMessageStringContent } from "@/features/conversation/conversation-message/conversation-message.utils";
import { getUnknownConsentConversationsQueryOptions } from "@/queries/unknown-consent-conversations-query";
import { captureError, captureErrorWithToast } from "@/utils/capture-error";
import { ConversationWithCodecsType } from "@/utils/xmtpRN/client.types";
import { getMessageContentType } from "@/utils/xmtpRN/content-types/content-types";
import { useQuery } from "@tanstack/react-query";

type ProcessedConversations = {
  likelyNotSpam: ConversationWithCodecsType[];
  likelySpam: ConversationWithCodecsType[];
};

// Helper function to process conversations
async function processConversationsForSpam(
  conversations: ConversationWithCodecsType[]
): Promise<ProcessedConversations> {
  const isSpamResults = await Promise.allSettled(
    conversations.map(async (conversation) => {
      try {
        const lastMessage = conversation.lastMessage!;
        const messageText = getMessageStringContent(lastMessage);

        if (!messageText) {
          return true;
        }

        const contentType = getMessageContentType(lastMessage.contentTypeId!);
        if (!contentType) {
          return true;
        }

        const spamScore = await getV3SpamScore({
          messageText: messageText,
          contentType,
        });

        return spamScore !== 0;
      } catch (error) {
        captureError(error);
        return true;
      }
    })
  );

  const notSpams: ConversationWithCodecsType[] = [];
  const spams: ConversationWithCodecsType[] = [];

  isSpamResults.forEach((result, index) => {
    if (result.status !== "fulfilled") {
      return;
    }
    const conversation = conversations[index];
    const isSpam = result.value;
    if (isSpam) {
      spams.push(conversation);
    } else {
      notSpams.push(conversation);
    }
  });

  return { likelyNotSpam: notSpams, likelySpam: spams };
}

export function useConversationRequestsListItem() {
  const currentAccount = useCurrentAccount();

  const { data, isLoading } = useQuery({
    ...getUnknownConsentConversationsQueryOptions({
      account: currentAccount!,
      context: "useConversationRequestsListItem",
    }),
    select: async (conversations: ConversationWithCodecsType[]) => {
      try {
        return await processConversationsForSpam(conversations);
      } catch (error) {
        captureErrorWithToast(error);
        // Default to putting all conversations in likelySpam if we have an error
        return {
          likelyNotSpam: [],
          likelySpam: conversations,
        };
      }
    },
  });

  return {
    likelyNotSpam: data?.likelyNotSpam ?? [],
    likelySpam: data?.likelySpam ?? [],
    isLoading,
  };
}
```

Key changes made:
1. Removed useState and useEffect in favor of React Query's `select` option
2. Extracted spam processing logic into a separate helper function
3. Used React Query's built-in data transformation with `select`
4. Simplified the return types and error handling
5. Removed the separate loading states in favor of React Query's unified `isLoading`
6. Added proper TypeScript types for the processed conversations

This refactoring leverages React Query's built-in capabilities to handle both the fetching and processing of conversations, while maintaining the same functionality. The `select` option allows us to transform the data after it's fetched, which is perfect for our spam classification process.

---



---

