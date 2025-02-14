## SpecStory

## Extending TypeScript Enum with Additional Status (12/16/2024, 10:52:13 AM)

_**User**_

export enum MessageDeliveryStatus {
  UNPUBLISHED = 'UNPUBLISHED',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
  ALL = 'ALL',
}

and I add another enum on this but not dirreclty in the enum?

---

_**Assistant**_

Based on your code and requirements, it seems you want to add "sending" as an additional status without modifying the original enum. Here's how you can type it correctly:

```typescript
type IConversationMessageStatusProps = {
  status: MessageDeliveryStatus | "sending";
};
```

Or if you want to be more explicit about all possible values:

```typescript
type IExtendedMessageDeliveryStatus = MessageDeliveryStatus | "sending";

type IConversationMessageStatusProps = {
  status: IExtendedMessageDeliveryStatus;
};
```

This approach:
1. Maintains the original enum
2. Adds the new "sending" status using a union type
3. Follows your TypeScript naming conventions (starting with 'I')
4. Avoids using the `&` intersection type which wouldn't work correctly in this case
5. Follows your preference for types over enums

The current code using `MessageDeliveryStatus & { "sending" }` is incorrect because it's trying to intersect an enum with an object type, which isn't what you want here. A union type (`|`) is the appropriate way to add additional string literal types to an enum's values.

---

_**User**_

For the code present, we get this error:
```
'IConversationMessageStatusProps' only refers to a type, but is being used as a value here.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

Here's the concise fix:

```typescript:features/conversation/conversation-message-status/conversation-message-status.tsx
const statusMapping: Record<MessageDeliveryStatus | "sending", string | undefined> = {
  UNPUBLISHED: translate("message_status.unpublished"),
  PUBLISHED: translate("message_status.published"),
  FAILED: translate("message_status.failed"),
  ALL: translate("message_status.all"),
  sending: translate("message_status.sending"),
};
```

This fixes the error because we're using the actual types directly instead of trying to reference the props type as a value.

---

_**User**_

For the code present, we get this error:
```
'IConversationMessageStatusProps' only refers to a type, but is being used as a value here.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

Here's the fix using the type directly:

```typescript:features/conversation/conversation-message-status/conversation-message-status.tsx
const statusMapping: Record<"sending" | "sent" | "error", string | undefined> = {
  sending: translate("message_status.sending"),
  sent: translate("message_status.sent"),
  error: translate("message_status.error"),
};
```

This matches your current implementation while fixing the type error by directly specifying the string literal union type.

---

_**User**_

For the code present, we get this error:
```
Type 'import("/Users/thierryskoda/Programming/converse-app/node_modules/@xmtp/react-native-sdk/build/lib/DecodedMessage").MessageDeliveryStatus' does not satisfy the expected type 'never'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_



Since you're using an exhaustive switch over `MessageDeliveryStatus`, you can remove the never check since all cases are handled:

```typescript
export function getConvosMessageStatus(message: DecodedMessageWithCodecsType) {
  switch (message.deliveryStatus) {
    case MessageDeliveryStatus.UNPUBLISHED:
      return "sending";
    case MessageDeliveryStatus.PUBLISHED:
      return "sent";
    case MessageDeliveryStatus.FAILED:
      return "error";
    case MessageDeliveryStatus.ALL:
      return "all";
  }
}
```

The error occurred because `MessageDeliveryStatus.ALL` wasn't handled in the switch.

---



---

