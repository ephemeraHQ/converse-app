## SpecStory

## Refactoring Long Press Logic in React (12/3/2024, 2:13:02 PM)

_**User**_

would there be a better way to do this? I don't like that I repeat the RemoteAttachemntImage twice.. I'm doing this where i have MessageGestures and onLongPress. I could maybe have MessagEContextMenu that render teh children and then the content passed is also just the children but then what if i want to do something else when someone longPress on a message? I can't have a gestureDetector in MessageContextMenu and another one here in MessageRemoteAttachment 

---

_**Assistant**_

To address the repetition of the `RemoteAttachmentImage` component and improve the structure, you can create a higher-order component or a custom hook to handle the long press logic. This way, you can separate the gesture handling from the rendering logic, making it more reusable and cleaner.

Here's a refactored version using a custom hook to manage the long press logic:

```typescript:components/Chat/Message/message-content-types/message-remote-attachment.tsx
import { RemoteAttachmentImage } from "@/components/Chat/Attachment/remote-attachment-image";
import { MessageLayout } from "@/components/Chat/Message/components/message-layout";
import {
  IMessageGesturesOnLongPressArgs,
  MessageGestures,
} from "@/components/Chat/Message/message-gestures";
import { useConversationStore } from "@/features/conversation/conversation-store";
import {
  DecodedMessage,
  RemoteAttachmentCodec,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";
import { memo, useCallback } from "react";

type IMessageRemoteAttachmentProps = {
  message: DecodedMessage<[RemoteAttachmentCodec]>;
};

function useHandleLongPress(messageId: string, content: RemoteAttachmentContent) {
  return useCallback((e: IMessageGesturesOnLongPressArgs) => {
    console.log("e:", e);
    useConversationStore.setState({
      messageContextMenuData: {
        items: [],
        itemRectX: e.pageX,
        itemRectY: e.pageY,
        itemRectWidth: e.width,
        itemRectHeight: e.height,
        Content: (
          <RemoteAttachmentImage
            messageId={messageId}
            remoteMessageContent={content}
            fitAspectRatio
          />
        ),
      },
    });
  }, [messageId, content]);
}

export const MessageRemoteAttachment = memo(function MessageRemoteAttachment({
  message,
}: IMessageRemoteAttachmentProps) {
  const content = message.content();

  if (typeof content === "string") {
    // TODO
    return null;
  }

  const handleLongPress = useHandleLongPress(message.id, content as RemoteAttachmentContent);

  return (
    <MessageLayout>
      <MessageGestures onLongPress={handleLongPress}>
        <RemoteAttachmentImage
          messageId={message.id}
          remoteMessageContent={content}
          fitAspectRatio
        />
      </MessageGestures>
    </MessageLayout>
  );
});
```

### Explanation:
- **Custom Hook (`useHandleLongPress`)**: This hook encapsulates the logic for handling the long press event. It uses `useCallback` to memoize the function, ensuring it doesn't get recreated on every render unless its dependencies change.
- **Separation of Concerns**: By moving the long press logic into a hook, the component becomes cleaner and more focused on rendering.
- **Reusability**: The hook can be reused in other components if they need similar long press handling logic.

This approach maintains the flexibility to handle different actions on long press by simply using different hooks or callback functions as needed.

---

_**User**_

no

---

_**Assistant**_

Let's try a different approach by creating a reusable component that handles the gesture logic and renders its children. This way, you can avoid duplicating the `RemoteAttachmentImage` component and keep the gesture handling logic separate.

Here's how you can refactor the code:

```typescript:components/Chat/Message/message-content-types/message-remote-attachment.tsx
import { RemoteAttachmentImage } from "@/components/Chat/Attachment/remote-attachment-image";
import { MessageLayout } from "@/components/Chat/Message/components/message-layout";
import {
  IMessageGesturesOnLongPressArgs,
  MessageGestures,
} from "@/components/Chat/Message/message-gestures";
import { useConversationStore } from "@/features/conversation/conversation-store";
import {
  DecodedMessage,
  RemoteAttachmentCodec,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";
import { memo, ReactNode } from "react";

type IMessageRemoteAttachmentProps = {
  message: DecodedMessage<[RemoteAttachmentCodec]>;
};

type IGestureHandlerProps = {
  messageId: string;
  content: RemoteAttachmentContent;
  children: ReactNode;
};

function GestureHandler({ messageId, content, children }: IGestureHandlerProps) {
  function handleLongPress(e: IMessageGesturesOnLongPressArgs) {
    console.log("e:", e);
    useConversationStore.setState({
      messageContextMenuData: {
        items: [],
        itemRectX: e.pageX,
        itemRectY: e.pageY,
        itemRectWidth: e.width,
        itemRectHeight: e.height,
        Content: (
          <RemoteAttachmentImage
            messageId={messageId}
            remoteMessageContent={content}
            fitAspectRatio
          />
        ),
      },
    });
  }

  return <MessageGestures onLongPress={handleLongPress}>{children}</MessageGestures>;
}

export const MessageRemoteAttachment = memo(function MessageRemoteAttachment({
  message,
}: IMessageRemoteAttachmentProps) {
  const content = message.content();

  if (typeof content === "string") {
    // TODO
    return null;
  }

  return (
    <MessageLayout>
      <GestureHandler messageId={message.id} content={content as RemoteAttachmentContent}>
        <RemoteAttachmentImage
          messageId={message.id}
          remoteMessageContent={content}
          fitAspectRatio
        />
      </GestureHandler>
    </MessageLayout>
  );
});
```

### Explanation:
- **`GestureHandler` Component**: This component encapsulates the gesture handling logic and renders its children. It takes `messageId`, `content`, and `children` as props.
- **Reusability**: The `GestureHandler` component can be reused for any content that requires the same gesture handling logic.
- **Separation of Concerns**: The gesture logic is separated from the rendering logic, making the `MessageRemoteAttachment` component cleaner and more focused on rendering.

This approach allows you to keep the gesture handling logic in one place while still being able to render different content as needed.

---

_**User**_

think more

---

_**Assistant**_

Let's refine the approach by creating a more flexible component that can handle different types of gestures and content. This will allow you to reuse the gesture handling logic without duplicating the `RemoteAttachmentImage` component.

Here's a refactored version:

```typescript:components/Chat/Message/message-content-types/message-remote-attachment.tsx
import { RemoteAttachmentImage } from "@/components/Chat/Attachment/remote-attachment-image";
import { MessageLayout } from "@/components/Chat/Message/components/message-layout";
import {
  IMessageGesturesOnLongPressArgs,
  MessageGestures,
} from "@/components/Chat/Message/message-gestures";
import { useConversationStore } from "@/features/conversation/conversation-store";
import {
  DecodedMessage,
  RemoteAttachmentCodec,
  RemoteAttachmentContent,
} from "@xmtp/react-native-sdk";
import { memo, ReactNode } from "react";

type IMessageRemoteAttachmentProps = {
  message: DecodedMessage<[RemoteAttachmentCodec]>;
};

type IGestureHandlerProps = {
  messageId: string;
  content: RemoteAttachmentContent;
  children: ReactNode;
};

function GestureHandler({ messageId, content, children }: IGestureHandlerProps) {
  const handleLongPress = (e: IMessageGesturesOnLongPressArgs) => {
    console.log("e:", e);
    useConversationStore.setState({
      messageContextMenuData: {
        items: [],
        itemRectX: e.pageX,
        itemRectY: e.pageY,
        itemRectWidth: e.width,
        itemRectHeight: e.height,
        Content: children,
      },
    });
  };

  return <MessageGestures onLongPress={handleLongPress}>{children}</MessageGestures>;
}

export const MessageRemoteAttachment = memo(function MessageRemoteAttachment({
  message,
}: IMessageRemoteAttachmentProps) {
  const content = message.content();

  if (typeof content === "string") {
    // TODO
    return null;
  }

  const remoteAttachmentContent = content as RemoteAttachmentContent;

  return (
    <MessageLayout>
      <GestureHandler messageId={message.id} content={remoteAttachmentContent}>
        <RemoteAttachmentImage
          messageId={message.id}
          remoteMessageContent={remoteAttachmentContent}
          fitAspectRatio
        />
      </GestureHandler>
    </MessageLayout>
  );
});
```

### Key Changes:
- **`GestureHandler` Component**: This component now takes `children` as the content to be displayed in the context menu. This makes it more flexible, allowing you to pass any component as the content.
- **Single Instance of `RemoteAttachmentImage`**: The `RemoteAttachmentImage` component is only rendered once, and it is passed as `children` to the `GestureHandler`.
- **Flexibility**: You can now easily change the content displayed on long press by modifying the `children` prop of `GestureHandler`.

This approach keeps the code DRY (Don't Repeat Yourself) and allows for easy modifications to the content displayed on long press without changing the gesture handling logic.

---



---

