## SpecStory

## Understanding TypeScript Type Compatibility (12/2/2024, 11:30:25 AM)

_**User**_

how come i don't have typescirpt error here?

type IComposerSendArgs=. {
    text?: string | undefined;
    remoteAttachment?: RemoteAttachmentContent | undefined;
    referencedMessageId?: MessageId | undefined;

}



sendMessage: (message: ISendMessageParams) => Promise<void>;

---

_**Assistant**_

The reason you don't have a TypeScript error in this case is due to the structural typing system that TypeScript uses, often referred to as "duck typing." In TypeScript, two types are considered compatible if their structures are compatible, meaning they have the same properties with compatible types.

Here's a breakdown of why `IComposerSendArgs` is compatible with `ISendMessageParams`:

1. **Optional Properties**: Both `text`, `referencedMessageId`, and `attachment` (or `remoteAttachment`) are optional in both types. This means that the absence of these properties in an object of either type is acceptable.

2. **Property Compatibility**:
   - `text` is of type `string | undefined` in `IComposerSendArgs` and `string | undefined` in `ISendMessageParams`. These are directly compatible.
   - `referencedMessageId` is of type `MessageId | undefined` in both types, which is directly compatible.
   - `remoteAttachment` in `IComposerSendArgs` is equivalent to `attachment` in `ISendMessageParams`. Since both are of type `RemoteAttachmentContent | undefined`, they are compatible.

3. **Excess Property Checks**: TypeScript allows for excess properties in function arguments if the target type is a union or if the function is called with an object literal. In this case, `remoteAttachment` is an excess property when `IComposerSendArgs` is passed to `sendMessage`, but TypeScript doesn't enforce strict excess property checks in this context.

To ensure clarity and avoid potential confusion, you might want to align the property names in both types. Here's how you could adjust `IComposerSendArgs` to match `ISendMessageParams`:

```typescript
type IComposerSendArgs = {
  text?: string;
  attachment?: RemoteAttachmentContent;
  referencedMessageId?: MessageId;
};
```

By aligning the property names, you maintain clear and consistent type definitions, reducing the risk of errors or misunderstandings in the future.

---

_**User**_

but sendMessage takes attachment and with IComposerSendARgs i have optional remoteAttachment

---

_**Assistant**_

In TypeScript, when you pass an object to a function, the object can have more properties than the function's parameter type expects, as long as the required properties are present and of the correct type. This is why you don't see a TypeScript error when passing `IComposerSendArgs` to `sendMessage`.

Here's a more detailed explanation:

1. **Structural Typing**: TypeScript uses structural typing, meaning that the compatibility of types is determined by their members. If `IComposerSendArgs` has all the properties required by `ISendMessageParams`, TypeScript considers them compatible, even if `IComposerSendArgs` has additional properties.

2. **Excess Property Checks**: When you pass an object literal directly to a function, TypeScript performs excess property checks. However, if the object is not a literal (e.g., it's a variable), these checks are not enforced. This means that if `IComposerSendArgs` is passed as a variable, TypeScript won't complain about the extra `remoteAttachment` property.

3. **Optional Properties**: Both `attachment` and `remoteAttachment` are optional. This means that their presence is not required for the types to be compatible.

To ensure clarity and avoid potential issues, you can map `remoteAttachment` to `attachment` before calling `sendMessage`. Here's how you can do it:

```typescript
// ... existing code ...
const handleSend = useCallback(
  async (args: IComposerSendArgs) => {
    const { remoteAttachment, ...rest } = args;
    const message: ISendMessageParams = {
      ...rest,
      attachment: remoteAttachment,
    };
    sendMessage(message);
  },
  [sendMessage]
);
// ... existing code ...
```

This approach explicitly maps `remoteAttachment` to `attachment`, ensuring that the `sendMessage` function receives the expected parameter structure.

---



---

