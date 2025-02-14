## SpecStory

## Simplifying TypeScript Types (12/11/2024, 10:47:34 AM)

_**User**_

simplify this

---

_**Assistant**_

I'll help simplify these TypeScript types while maintaining their core functionality. Here's a clearer version:

```typescript:node_modules/@xmtp/react-native-sdk/src/lib/types/ConversationCodecs.ts
// Simple type for text content
export type ITextContent = {
  text: string
}

// Maps content types to their decoded formats
export type IContentCodecMap<T extends ContentCodec<any>> = T extends {
  contentKey: infer K
}
  ? { [key in K & string]: ExtractDecodedType<T> }
  : ExtractDecodedType<T>

// Type for sending messages - either text or encoded content
export type IConversationPayload<T extends ContentCodec<any>[]> =
  | IContentCodecMap<T[number] | TextCodec>
  | string
```

Key changes made:
1. Renamed types to follow the `I` prefix convention
2. Simplified the nested conditional types by using the `&` operator instead of multiple extends
3. Made the type parameter names more descriptive (`T` instead of `ContentTypes`)
4. Added comments to explain each type's purpose
5. Removed unnecessary `never` type check since `K & string` achieves the same result

The functionality remains the same, but the types are now more readable and follow your preferred conventions.

---



---

