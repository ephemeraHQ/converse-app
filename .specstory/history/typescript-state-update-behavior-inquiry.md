## SpecStory

## TypeScript State Update Behavior Inquiry (11/19/2024, 12:24:25 PM)

_**User**_

the store is this type Write<Write<StoreApi<IConversationPersistedStore>, StoreSubscribeWithSelector<IConversationPersistedStore>>, StorePersist<...>>

But still doens'T give error if i do caca:null????

---

_**Assistant**_

The reason you're not getting an error when setting `caca: null` in the `setState` function is likely due to the way TypeScript is handling the types in this context. The `setState` function is designed to accept a partial update to the state, and TypeScript might not be enforcing strict type checks on the keys of the state object in this particular case.

Here's a breakdown of why this might be happening:

1. **TypeScript's Structural Typing**: TypeScript uses structural typing, which means it checks the shape of the objects rather than their exact types. If `setState` is designed to accept any object that matches part of the state shape, it might not strictly enforce the exact keys.

2. **Partial Updates**: The `setState` function is often used to update only a part of the state. If the function is typed to accept a partial state object, it might not check for the presence of all keys, allowing you to add keys that don't exist in the original state type.

3. **Type Definitions**: If the type definitions for `setState` or the state itself are not strict enough, TypeScript might not catch the error. For example, if `setState` is typed to accept `Partial<IConversationPersistedStore>`, it won't enforce the exact keys.

To ensure stricter type checking, you can do the following:

- **Explicit Type Checking**: Make sure that the `setState` function is correctly typed to only accept valid keys of `IConversationPersistedStore`.

- **Use TypeScript's `keyof`**: You can use `keyof` to ensure that only valid keys are being used in the state updates.

Here's a small example of how you might enforce stricter type checking:

```typescript
type IConversationPersistedStore = {
  composerMediaPreview: IComposerMediaPreview | null;
  mediaURI: string | null;
  status: string;
  dimensions: { height: number; width: number } | null;
  replyingToMessageId: string | null;
  inputValue: string;
  uploadedRemoteAttachment: RemoteAttachmentContent | null;
};

function updateState<K extends keyof IConversationPersistedStore>(
  key: K,
  value: IConversationPersistedStore[K]
) {
  const conversationStore = getCurrentConversationPersistedStore();
  conversationStore.setState((state) => ({
    ...state,
    [key]: value,
  }));
}

// Usage
updateState('composerMediaPreview', null); // Correct
// updateState('caca', null); // TypeScript will error here
```

By using a helper function like `updateState`, you can leverage TypeScript's type system to ensure that only valid keys are used when updating the state.

---



---

