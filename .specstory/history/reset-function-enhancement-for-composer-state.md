## SpecStory

## Reset Function Enhancement for Composer State (12/10/2024, 11:31:34 AM)

_**User**_

i want the reset to also reset like composerMediauPreview,etc...

---

_**Assistant**_

I'll help you modify the `reset` function to reset all the state values, not just the `DEFAULT_PROPS`. Here's the updated code:

```typescript:features/conversation/conversation-composer/conversation-composer-store.tsx
const createConversationComposerStore = (
  initProps: IConversationComposerStoreProps
) => {
  const DEFAULT_PROPS: IConversationComposerStoreProps = {
    inputValue: "",
    topic: undefined,
  };

  const DEFAULT_STATE = {
    ...DEFAULT_PROPS,
    composerMediaPreview: null,
    composerUploadedAttachment: null,
    replyingToMessageId: null,
  };

  return createStore<IConversationComposerStoreState>()(
    subscribeWithSelector(
      persist(
        (set) => ({
          ...DEFAULT_STATE,
          ...initProps,
          setInputValue: (value) => set({ inputValue: value }),
          setReplyToMessageId: (messageId) =>
            set({ replyingToMessageId: messageId }),
          setComposerMediaPreview: (mediaPreview) =>
            set({ composerMediaPreview: mediaPreview }),
          setComposerUploadedAttachment: (attachment) =>
            set({ composerUploadedAttachment: attachment }),
          reset: () => set(DEFAULT_STATE),
        }),
        // ... rest of the persist config
```

The changes:
1. Created a new `DEFAULT_STATE` object that includes all the initial state values
2. Used `DEFAULT_STATE` instead of `DEFAULT_PROPS` in the initial state spread
3. Updated the `reset` function to use `DEFAULT_STATE` instead of `DEFAULT_PROPS`

This way, when `reset()` is called, it will reset all state values to their initial state, including `composerMediaPreview`, `composerUploadedAttachment`, and `replyingToMessageId`.

---



---

