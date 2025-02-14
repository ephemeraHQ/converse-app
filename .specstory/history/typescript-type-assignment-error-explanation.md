## SpecStory

## TypeScript Type Assignment Error Explanation (11/12/2024, 9:50:44 AM)

_**User**_

I don't undersstand why i get "Type 'string' is not assignable to type 'never'.
  Type 'string' is not assignable to type 'never'." contentType is not string type

---

_**Assistant**_

The issue occurs because your `getMessageContentType` function is likely returning a string type, but the switch case expects to handle all possible cases exhaustively. The `_ensureNever` pattern is used to ensure type exhaustiveness in switch statements, but it's not working as expected because your contentType isn't properly typed.

Let's fix this by creating a proper type for the content types:

```typescript:components/Chat/Message/V3Message.tsx
// ... existing imports ...

type MessageContentType = "groupUpdated" | "text";

// Update the switch statement
switch (contentType as MessageContentType) {
  case "groupUpdated":
    return (
      <VStack>
        <ChatGroupUpdatedMessage
          content={content as unknown as GroupUpdatedContent}
        />
      </VStack>
    );
  case "text":
    const textContent = content as string;
    const hideBackground = isAllEmojisAndMaxThree(textContent as string);
    return (
      <VStack>
        <TextMessage
          fromMe={messageToDisplay.fromMe}
          hideBackground={hideBackground}
          content={(content as string) + index}
        />
      </VStack>
    );

  default:
    const _ensureNever: never = contentType as never;
    return (
      <VStack>
        <TextMessage
          fromMe={messageToDisplay.fromMe}
          hideBackground={false}
          content={contentType + message.deliveryStatus + index}
        />
      </VStack>
    );
}
```

The issue was that `getMessageContentType` was probably returning a string type, which can't be assigned to `never`. By creating a specific union type `MessageContentType` and using type assertions, we ensure type safety while maintaining exhaustive checking.

You should also update your `getMessageContentType` function to return the proper type:

```typescript:utils/xmtpRN/contentTypes.ts
export function getMessageContentType(contentTypeId: string): MessageContentType {
  // your implementation
}
```

This way, TypeScript will properly enforce type checking and the exhaustive check will work as intended.

---



---

