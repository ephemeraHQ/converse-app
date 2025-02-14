## SpecStory

## TypeScript Typing Cleanup Suggestions (2/5/2025, 9:55:56 AM)

_**User**_

can we make the tpying cleaner?

---

_**Assistant**_

I'll help clean up the types in this file. Here are the suggested changes:

```typescript:features/conversation/conversation.store-context.tsx
// ... existing code ...

// Simplified base props type with optional fields
type IConversationStoreProps = {
  topic?: ConversationTopic | null;
  highlightedMessageId?: MessageId | null;
  scrollToMessageId?: MessageId | null;
  searchSelectedUserInboxIds?: InboxId[];
  isCreatingNewConversation?: boolean;
};

// State type that makes all fields required and adds searchTextValue
type IConversationStoreState = {
  [K in keyof IConversationStoreProps]-?: NonNullable<IConversationStoreProps[K]>
} & {
  searchTextValue: string;
};

// Simplified provider props type
type IConversationStoreProviderProps = React.PropsWithChildren<IConversationStoreProps>;

// Store type using ReturnType
type IConversationStore = ReturnType<typeof createConversationStore>;

// ... existing code ...
```

Key changes made:
1. Used mapped type with `-?` to make all fields required in `IConversationStoreState`
2. Used `NonNullable` to handle the `| null` cases
3. Simplified the `IConversationStoreState` definition by extending from `IConversationStoreProps`
4. Kept the types consistent with the style guide by prefixing with 'I'

The rest of the file can remain unchanged as these type definitions will work seamlessly with the existing implementation.

---

_**User**_

For the code present, we get this error:
```
Argument of type 'EntityObjectWithAddress<import("/Users/thierryskoda/Programming/converse-app/node_modules/@xmtp/react-native-sdk/build/lib/Member").Member, string>' is not assignable to parameter of type 'import("/Users/thierryskoda/Programming/converse-app/queries/entify").EntityObjectWithAddress<import("/Users/thierryskoda/Programming/converse-app/node_modules/@xmtp/react-native-sdk/build/lib/Member").Member, string>'.
  Property 'addresses' is missing in type 'EntityObjectWithAddress<import("/Users/thierryskoda/Programming/converse-app/node_modules/@xmtp/react-native-sdk/build/lib/Member").Member, string>' but required in type 'import("/Users/thierryskoda/Programming/converse-app/queries/entify").EntityObjectWithAddress<import("/Users/thierryskoda/Programming/converse-app/node_modules/@xmtp/react-native-sdk/build/lib/Member").Member, string>'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error suggests there's a mismatch between your local `EntityObjectWithAddress` type and the one imported from the queries. Here's the fix:

```typescript:utils/groupUtils/adminUtils.test.ts
// Remove the local type definition and import it instead
import { EntityObjectWithAddress } from "@/queries/entify";

// ... rest of the existing code ...
```

Remove the local `EntityObjectWithAddress` type definition and import it from where it's properly defined. This ensures type consistency across the codebase.

---



---

