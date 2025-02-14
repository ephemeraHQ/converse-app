## SpecStory

## Implementing React Reactions with React Query (2/6/2025, 9:29:06 AM)

_**User**_

check this doc and implement some react logic using react-query you can use my client @queryClient.ts 
And make sure to implement showing some reactions . check the XMTP docs @https://docs.xmtp.org/inboxes/content-types/reactions 

I'm using react-query 

---

_**Assistant**_

I'll help you create a React component that handles message reactions using XMTP and React Query. I'll create a few files to demonstrate this implementation.

First, let's create the types and codec setup:

```typescript:features/reactions/reactions.types.ts
import { ContentTypeReaction } from "@xmtp/content-type-reaction";

export type ReactionAction = "added" | "removed";
export type ReactionSchema = "Unicode" | "shortcode" | "custom";

export interface IReaction {
  reference: string; // Message ID being reacted to
  action: ReactionAction;
  content: string; // emoji or reaction content
  schema?: ReactionSchema;
}

export interface IReactionMutation {
  conversationId: string;
  messageId: string;
  reaction: string;
}
```

Now let's create the React Query hooks for handling reactions:

```typescript:features/reactions/reactions.queries.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { ContentTypeReaction, ReactionCodec } from "@xmtp/content-type-reaction";
import { queryClient } from "@/queries/queryClient";
import { IReaction, IReactionMutation } from "./reactions.types";
import logger from "@/utils/logger";

const QUERY_KEYS = {
  reactions: (messageId: string) => ["reactions", messageId],
};

// Query to fetch reactions for a specific message
export function useMessageReactions({ messageId }: { messageId: string }) {
  return useQuery({
    queryKey: QUERY_KEYS.reactions(messageId),
    queryFn: async () => {
      // This would be your actual implementation to fetch reactions
      // from your local database or XMTP client
      logger.debug(`Fetching reactions for message: ${messageId}`);
      return [] as IReaction[];
    },
  });
}

// Mutation to toggle a reaction
export function useToggleReaction() {
  return useMutation({
    mutationFn: async ({ conversationId, messageId, reaction }: IReactionMutation) => {
      try {
        // This assumes you have access to your XMTP client and conversation
        const conversation = await getConversation(conversationId);
        
        const reactionObj = {
          reference: messageId,
          action: "added", // You might want to toggle this based on existing reactions
          content: reaction,
          schema: "Unicode",
        };

        await conversation.send(reactionObj, {
          contentType: ContentTypeReaction,
        });

        return reactionObj;
      } catch (error) {
        logger.debug(`Error toggling reaction: ${error}`);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate the reactions query to trigger a refetch
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.reactions(variables.messageId),
      });
    },
  });
}
```

Now let's create a React component to display and handle reactions:

```typescript:features/reactions/message-reactions.tsx
import { memo } from "react";
import { useMessageReactions, useToggleReaction } from "./reactions.queries";
import { Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "@/theme/useAppTheme";

interface IMessageReactionsProps {
  messageId: string;
  conversationId: string;
}

const AVAILABLE_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export const MessageReactions = memo(function MessageReactions({ 
  messageId, 
  conversationId 
}: IMessageReactionsProps) {
  const { theme } = useAppTheme();
  
  const { data: reactions, isLoading } = useMessageReactions({ 
    messageId 
  });
  
  const { mutate: toggleReaction } = useToggleReaction();

  const handleReactionPress = (reaction: string) => {
    toggleReaction({
      conversationId,
      messageId,
      reaction,
    });
  };

  if (isLoading) {
    return null;
  }

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {AVAILABLE_REACTIONS.map((reaction) => {
        const count = reactions?.filter(
          (r) => r.content === reaction && r.action === "added"
        ).length ?? 0;

        return (
          <TouchableOpacity
            key={reaction}
            onPress={() => handleReactionPress(reaction)}
            style={[
              {
                borderRadius: 16,
                padding: 4,
                backgroundColor: theme.colors.background,
                flexDirection: "row",
                alignItems: "center",
              },
            ]}
          >
            <Text>{reaction}</Text>
            {count > 0 && (
              <Text style={{ marginLeft: 4, color: theme.colors.text }}>
                {count}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
});
```

To use this component, you would add it to your message component like this:

```typescript:features/messages/message.tsx
export const Message = memo(function Message({ 
  message,
  conversationId 
}: IMessageProps) {
  return (
    <View>
      {/* Your existing message content */}
      <MessageReactions 
        messageId={message.id} 
        conversationId={conversationId} 
      />
    </View>
  );
});
```

This implementation:

1. Creates type definitions for reactions
2. Sets up React Query hooks for fetching and managing reactions
3. Creates a reusable component for displaying reactions
4. Uses the existing queryClient configuration
5. Follows the XMTP reaction content type specification
6. Implements proper error handling and logging
7. Uses memoization for performance
8. Follows the style guide with proper naming and file structure

Note that you'll need to:

1. Register the ReactionCodec with your XMTP client during initialization
2. Implement the actual database storage and retrieval for reactions
3. Add proper styling according to your theme
4. Handle the actual XMTP client and conversation management
5. Add proper error boundaries and loading states

Would you like me to elaborate on any of these aspects or show how to implement any specific part in more detail?

---



---

