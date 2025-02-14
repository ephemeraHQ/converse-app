## SpecStory

## Separating Functions from Store State (12/10/2024, 11:36:11 AM)

_**User**_

I want to serpate functions (actions) from the store state... otherwise the reset will reset the functions which i don't want

---

_**Assistant**_

I'll help you separate the actions from the state in the store. Here's how we can modify the code:

```typescript:features/conversation/conversation-composer/conversation-composer-store.tsx
// ... existing imports ...

// Separate state interface from actions
type IConversationComposerState = {
  inputValue: string;
  topic: ConversationTopic | undefined;
  replyingToMessageId: MessageId | null;
  composerMediaPreview: IComposerMediaPreview;
  composerUploadedAttachment: RemoteAttachmentContent | null;
};

type IConversationComposerActions = {
  reset: () => void;
  setInputValue: (value: string) => void;
  setReplyToMessageId: (messageId: MessageId | null) => void;
  setComposerMediaPreview: (mediaPreview: IComposerMediaPreview) => void;
  setComposerUploadedAttachment: (attachment: RemoteAttachmentContent | null) => void;
  updateMediaPreviewStatus: (status: IComposerMediaPreviewStatus) => void;
};

// Combined type for the store
type IConversationComposerStoreState = IConversationComposerState & IConversationComposerActions;

// ... existing code until createConversationComposerStore ...

const createConversationComposerStore = (
  initProps: IConversationComposerStoreProps
) => {
  const DEFAULT_STATE: IConversationComposerState = {
    inputValue: "",
    topic: undefined,
    ...initProps,
    composerMediaPreview: null,
    composerUploadedAttachment: null,
    replyingToMessageId: null,
  };

  return createStore<IConversationComposerStoreState>()(
    subscribeWithSelector(
      persist(
        (set) => ({
          ...DEFAULT_STATE,
          reset: () =>
            set((state) => ({
              ...state,
              ...DEFAULT_STATE,
            })),
          setInputValue: (value) => set({ inputValue: value }),
          setReplyToMessageId: (messageId) =>
            set({ replyingToMessageId: messageId }),
          setComposerMediaPreview: (mediaPreview) =>
            set({ composerMediaPreview: mediaPreview }),
          setComposerUploadedAttachment: (attachment) =>
            set({ composerUploadedAttachment: attachment }),
          updateMediaPreviewStatus: (status) =>
            set((state) => ({
              ...state,
              composerMediaPreview: {
                ...state.composerMediaPreview!,
                status,
              },
            })),
        }),
        {
          storage: createJSONStorage(() => zustandMMKVStorage),
          name: initProps.topic || "new-conversation",
          partialize: (state) => ({
            inputValue: state.inputValue,
            replyingToMessageId: state.replyingToMessageId,
            composerMediaPreview: state.composerMediaPreview,
            composerUploadedAttachment: state.composerUploadedAttachment,
          }),
        }
      )
    )
  );
};

// ... rest of the code ...
```

Key changes made:
1. Separated the state interface (`IConversationComposerState`) from actions interface (`IConversationComposerActions`)
2. Removed the actions from `DEFAULT_STATE` since they're now handled separately
3. Modified the `reset` function to preserve the actions by spreading the current state first
4. Updated the store type to be a combination of state and actions

This way, when you call `reset()`, it will only reset the state values while preserving the action functions.

---



---

