Below is a single TypeScript file (SendFirstMessageExample.tsx) that demonstrates: 1. Type definitions (for Conversation, Message, etc.) 2. A helper function (getMemberHash) 3. A fake API call (sendFirstMessageApi) 4. The custom React Query hook (useSendFirstMessage) that does all of our optimistic logic 5. An example component (NewConversationComposer) showing usage.

Everything is in one file for illustration purposes. In a real application, you would likely split this into multiple files (types, hooks, components, etc.).

// File: SendFirstMessageExample.tsx

import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/\*\*

- ***
- Type Definitions
- ***
  \*/

// Basic shape of a Conversation.
export type Conversation = {
id: string; // Unique ID
members: string[]; // The list of member IDs (e.g. Ethereum addresses)
lastMessage?: Message; // Optional: last message for convenience in conversation list
updatedAt?: number; // Optional: timestamp or other metadata
};

// Basic shape of a Message.
export type Message = {
id: string; // Unique ID
conversationId: string; // The ID of the conversation this message belongs to
text: string; // Message text
sender: string; // ID of the user who sent the message
createdAt?: number; // Optional: timestamp
};

// The server response when we "create/find conversation + send first message."
export type SendFirstMessageServerResponse = {
conversation: Conversation;
message: Message;
};

/\*\*

- ***
- Utility: getMemberHash
- ***
- A simple function to produce a stable string representing the sorted,
- lowercased list of members.
  \*/
  export function getMemberHash(members: string[]): string {
  // 1) Sort members (case-insensitive)
  const sorted = [...members].sort((a, b) =>
  a.localeCompare(b, undefined, { sensitivity: 'base' })
  );
  // 2) Lowercase them
  const lowercased = sorted.map(m => m.toLowerCase());
  // 3) Join into a single string
  return lowercased.join('\_');
  }

/\*\*

- ***
- Fake API Call: sendFirstMessageApi
- ***
- This simulates an API or SDK call that either:
- - Finds or creates the conversation on the server
- - Creates the first message in that conversation
-
- In real life, you'd separate or unify these calls in your backend/SDK as needed.
  \*/
  async function sendFirstMessageApi(params: {
  members: string[];
  text: string;
  sender: string;
  }): Promise<SendFirstMessageServerResponse> {
  const { members, text, sender } = params;

// Simulate an async server call with setTimeout
return new Promise((resolve) => {
setTimeout(() => {
const now = Date.now();
// Generate a "real" server conversation ID
const realConversationId = `server-convo-${now}`;
// Generate a "real" message ID
const realMessageId = `server-msg-${now}`;

      // Return data that you'd normally get from your backend
      resolve({
        conversation: {
          id: realConversationId,
          members,
          lastMessage: {
            id: realMessageId,
            conversationId: realConversationId,
            text,
            sender,
            createdAt: now
          },
          updatedAt: now
        },
        message: {
          id: realMessageId,
          conversationId: realConversationId,
          text,
          sender,
          createdAt: now
        }
      });
    }, 1000); // 1 second delay to simulate network

});
}

/\*\*

- ***
- Custom Hook: useSendFirstMessage
- ***
- This hook:
- - Accepts a list of members
- - Determines if a conversation for those members already exists in the React Query cache
- - Exposes a function `sendFirstMessage(text)` which:
-      1) Applies optimistic updates (onMutate)
-      2) Calls the API
-      3) Replaces or reverts the optimistic data in onSuccess/onError
- - Returns data so the caller can display a conversation preview (if it exists).
    \*/
    export function useSendFirstMessage(members: string[]) {
    const queryClient = useQueryClient();

/\*\*

- We compute a stable "member hash" so we know how to identify
- any existing conversation for these members. We use JSON.stringify
- in the dependency array to handle changes in the array content.
  \*/
  const memberHash = useMemo(() => getMemberHash(members), [JSON.stringify(members)]);

/\*\*

- Determine conversation type for convenience
  \*/
  const conversationType = members.length === 1 ? 'dm' : 'group';

/\*\*

- Lookup any existing conversation in the cache:
- We assume we store all conversations in `['conversations']`.
  \*/
  const allConversations =
  queryClient.getQueryData<Conversation[]>(['conversations']) || [];
  const existingConversation = useMemo(() => {
  return allConversations.find(conv => {
  const convHash = getMemberHash(conv.members);
  return convHash === memberHash;
  });
  }, [allConversations, memberHash]);

/\*\*

- Our React Query mutation: we only need `text` when we call `mutate`.
- The members/sender are captured via closure.
  \*/
  const mutation = useMutation<
  SendFirstMessageServerResponse, // success type
  Error, // error type
  string, // variables = the message text
  {
  tempConversationId?: string;
  tempMessageId?: string;
  existingConversationId?: string;
  // Optional: we might store previous conversation data for revert
  }

  > ({
  > mutationFn: async (text: string) => {

      // Hardcoded current user ID for demo
      const currentUserId = '0xCURRENT_USER_ID';

      // Do the real (or fake) API request
      return await sendFirstMessageApi({
        members,
        text,
        sender: currentUserId
      });

  },


    /**
     * onMutate: We perform optimistic updates here:
     *  1) Cancel queries so we don't overwrite our changes.
     *  2) If conversation does not exist, create a temp conversation.
     *  3) Add a temp message to the conversation detail.
     */
    onMutate: async (text: string) => {
      const currentUserId = '0xCURRENT_USER_ID';

      // Cancel any 'conversations' fetches that might overwrite our optimistic updates
      await queryClient.cancelQueries(['conversations']);

      if (existingConversation) {
        // Conversation already exists in cache
        const existingConversationId = existingConversation.id;
        const tempMessageId = `temp-msg-${currentUserId}-${Date.now()}`;

        // Update the conversation list item (set lastMessage, updatedAt)
        queryClient.setQueryData<Conversation[]>(['conversations'], (old = []) =>
          old.map(conv => {
            if (conv.id === existingConversationId) {
              return {
                ...conv,
                lastMessage: {
                  id: tempMessageId,
                  conversationId: existingConversationId,
                  text,
                  sender: currentUserId
                },
                updatedAt: Date.now()
              };
            }
            return conv;
          })
        );

        // Insert optimistic message into the detail
        queryClient.setQueryData<Message[]>(['conversation', existingConversationId], (oldMsgs = []) => [
          ...oldMsgs,
          {
            id: tempMessageId,
            conversationId: existingConversationId,
            text,
            sender: currentUserId
          }
        ]);

        // Return context for rollback
        return {
          existingConversationId,
          tempMessageId
        };
      } else {
        // Conversation does NOT exist, create a temp conversation
        const tempConversationId = `temp-convo-${memberHash}-${Date.now()}`;
        const tempMessageId = `temp-msg-${currentUserId}-${Date.now()}`;

        // Insert the temp conversation into the list
        const newConv: Conversation = {
          id: tempConversationId,
          members,
          lastMessage: {
            id: tempMessageId,
            conversationId: tempConversationId,
            text,
            sender: currentUserId
          },
          updatedAt: Date.now()
        };
        queryClient.setQueryData<Conversation[]>(['conversations'], (old = []) => [
          ...old,
          newConv
        ]);

        // Insert the temp message into the conversation detail
        queryClient.setQueryData<Message[]>(['conversation', tempConversationId], (old = []) => [
          ...old,
          {
            id: tempMessageId,
            conversationId: tempConversationId,
            text,
            sender: currentUserId
          }
        ]);

        return {
          tempConversationId,
          tempMessageId
        };
      }
    },

    /**
     * onSuccess: Replace the optimistic data with real data
     */
    onSuccess: (data, text, context) => {
      const { conversation: realConv, message: realMsg } = data;
      const {
        tempConversationId,
        tempMessageId,
        existingConversationId
      } = context || {};

      // 1) If we created a temp conversation, remove it
      if (tempConversationId) {
        queryClient.setQueryData<Conversation[]>(['conversations'], (old = []) =>
          old.filter(conv => conv.id !== tempConversationId)
        );
      }

      // 2) Insert/update the real conversation in the list
      //    (Remove any older version of the realConv if it exists)
      queryClient.setQueryData<Conversation[]>(['conversations'], (old = []) => {
        // Filter out old version
        const filtered = old.filter(conv => conv.id !== realConv.id);
        // Insert the new real conversation
        return [
          ...filtered,
          {
            ...realConv,
            lastMessage: realMsg,
            updatedAt: Date.now()
          }
        ];
      });

      // 3) Remove the temp message from conversation detail if it existed
      if (tempMessageId) {
        const convIdToRemoveTemp = tempConversationId || existingConversationId;
        if (convIdToRemoveTemp) {
          queryClient.setQueryData<Message[]>(['conversation', convIdToRemoveTemp], (oldMsgs = []) =>
            oldMsgs.filter(m => m.id !== tempMessageId)
          );
        }
      }

      // 4) Insert the real message into its conversation detail
      queryClient.setQueryData<Message[]>(['conversation', realMsg.conversationId], (oldMsgs = []) => [
        ...oldMsgs,
        realMsg
      ]);

      // Optional: you could invalidate queries here if you want guaranteed fresh data
      // queryClient.invalidateQueries(['conversation', realMsg.conversationId]);
    },

    /**
     * onError: revert any optimistic updates
     */
    onError: (error, text, context) => {
      const { tempConversationId, tempMessageId, existingConversationId } = context || {};

      // If we optimistically created a new conversation, remove it
      if (tempConversationId) {
        queryClient.setQueryData<Conversation[]>(['conversations'], (old = []) =>
          old.filter(c => c.id !== tempConversationId)
        );
        queryClient.setQueryData<Message[]>(['conversation', tempConversationId], []);
      }

      // If it was an existing conversation, remove the temp message
      if (existingConversationId && tempMessageId) {
        queryClient.setQueryData<Message[]>(['conversation', existingConversationId], (oldMsgs = []) =>
          oldMsgs.filter(m => m.id !== tempMessageId)
        );
      }

      // You might also revert the conversation's lastMessage in the list
      // if you stored its previous state in the context.

      console.error('Error sending first message:', error);
    },

    // Optional final step
    // onSettled: (data, error, text, context) => {
    //   // e.g. queryClient.invalidateQueries(['conversations']);
    // }

});

/\*\*

- Our public function for sending the message. The user only needs to pass `text`.
- (Members are already known in the hook.)
  \*/
  function sendFirstMessage(text: string) {
  mutation.mutate(text);
  }

// Return relevant data for the UI
return {
conversation: existingConversation, // The existing conversation if found
conversationType,
sendFirstMessage,
isLoading: mutation.isLoading,
isError: mutation.isError,
error: mutation.error,
data: mutation.data
};
}

/\*\*

- ***
- Example Component: NewConversationComposer
- ***
- Demonstrates how we'd use `useSendFirstMessage`.
- The user can select members, see if there's a conversation preview,
- and then send the first message.
  \*/
  export function NewConversationComposer() {
  // For demonstration, an array of members the user has chosen
  const [members, setMembers] = useState<string[]>([]);
  // The text the user is typing
  const [draftText, setDraftText] = useState('');

// Our custom hook
const {
conversation,
conversationType,
sendFirstMessage,
isLoading,
isError,
error
} = useSendFirstMessage(members);

// Handler for adding a mock member
function handleAddMember() {
// For example, we create a mock address
const newMember = `0xFakeUser${Math.floor(Math.random() * 1000)}`;
setMembers(current => [...current, newMember]);
}

// Handler to actually send the message
function handleSend() {
sendFirstMessage(draftText);
setDraftText(''); // Clear after sending
}

return (
<div style={{ padding: 16, fontFamily: 'sans-serif' }}>
<h2>New {conversationType === 'dm' ? 'DM' : 'Group'} Conversation</h2>

      <div style={{ marginBottom: 8 }}>
        <strong>Selected Members:</strong> {members.join(', ') || '(none)'}
      </div>
      <button onClick={handleAddMember}>
        Add Random Member
      </button>

      <div style={{ marginTop: 16 }}>
        {conversation ? (
          <div style={{ border: '1px solid #ccc', padding: 8 }}>
            <p><strong>Preview: Conversation ID:</strong> {conversation.id}</p>
            {conversation.lastMessage ? (
              <p>Last Message: {conversation.lastMessage.text}</p>
            ) : (
              <p>No messages yet</p>
            )}
          </div>
        ) : (
          <p>No existing conversation for these members — will create one.</p>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <textarea
          rows={3}
          cols={40}
          placeholder="Type your first message..."
          value={draftText}
          onChange={e => setDraftText(e.target.value)}
        />
      </div>
      <button
        style={{ marginTop: 8 }}
        onClick={handleSend}
        disabled={isLoading}
      >
        {isLoading ? 'Sending...' : 'Send First Message'}
      </button>

      {isError && (
        <div style={{ color: 'red', marginTop: 8 }}>
          Error: {error?.message}
        </div>
      )}
    </div>

);
}

How to Use 1. Install Dependencies
• You need React 16.8+ (for hooks) and @tanstack/react-query (or react-query) at the appropriate version.
• For example:

npm install react react-dom @tanstack/react-query

    2.	Set up React Query Provider

Make sure to wrap your app in the QueryClientProvider:

// index.tsx or App.tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReactDOM from 'react-dom';
import { NewConversationComposer } from './SendFirstMessageExample';

const queryClient = new QueryClient();

function App() {
return (
<QueryClientProvider client={queryClient}>
<NewConversationComposer />
</QueryClientProvider>
);
}

ReactDOM.render(<App />, document.getElementById('root'));

    3.	Run & Test
    •	When you click “Add Random Member” it adds a mocked address.
    •	When you type a message and send, you’ll see:
    •	An optimistic conversation created (if none existed).
    •	An optimistic message.
    •	After 1 second (the simulated API delay), the real conversation and message IDs come in.

Notes & Comments in the Code
• The inline comments explain why we do certain steps (e.g. canceling queries in onMutate, returning context for onError rollbacks, etc.).
• Feel free to adapt variable names, remove or add fields (e.g. createdAt, updatedAt, etc.) to your exact data models.
• This single-file example can be split up into separate files (one for hooks, one for types, etc.) in a production codebase.
