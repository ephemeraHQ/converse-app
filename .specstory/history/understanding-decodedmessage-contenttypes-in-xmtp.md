## SpecStory

## Understanding DecodedMessage ContentTypes in XMTP (11/13/2024, 2:30:09 PM)

_**User**_

why here DecodedMessage can be of many ContentTypes?

---

_**Assistant**_

The `DecodedMessage` class is made generic with `ContentTypes` to support different types of message content in the XMTP messaging protocol. Let me break this down:

1. The generic type declaration:
```typescript
export class DecodedMessage<
  ContentTypes extends DefaultContentTypes = DefaultContentTypes
>
```

This means:
- The class can work with different content types
- These content types must extend `DefaultContentTypes`
- If no specific content type is provided, it defaults to `DefaultContentTypes`

2. The purpose:
- XMTP is a messaging protocol that supports various message formats (not just text)
- Different applications might need to handle different types of content (text, images, attachments, etc.)
- Each content type has its own codec (encoder/decoder) for serialization/deserialization

3. Usage example:
```typescript
// Text message
type TextContent = {
  type: 'text';
  content: string;
}

// Image message
type ImageContent = {
  type: 'image';
  url: string;
  dimensions: { width: number; height: number };
}

// Custom app content types
type MyAppContentTypes = [TextContent, ImageContent];

// Create a message instance with custom content types
const message = new DecodedMessage<MyAppContentTypes>();
```

This generic approach allows:
- Type safety when working with different message contents
- Extensibility for applications to define their own content types
- Proper typing for the `content()` method which returns the decoded content based on the content type

The flexibility is particularly visible in the `content()` method where it uses the generic type to determine the return type:
```typescript
content(): ExtractDecodedType<[...ContentTypes, TextCodec][number] | string>
```

---



---

