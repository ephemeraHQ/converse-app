/**
 * This store/context is to avoid prop drilling in message components.
 */

import { convertNanosecondsToMilliseconds } from "@/features/conversation/conversation-message/conversation-message.utils";
import { hasNextMessageInSeries } from "@/features/conversations/utils/hasNextMessageInSeries";
import { hasPreviousMessageInSeries } from "@/features/conversations/utils/hasPreviousMessageInSeries";
import { messageIsFromCurrentUserV3 } from "@/features/conversations/utils/messageIsFromCurrentUser";
import { messageShouldShowDateChange } from "@/features/conversations/utils/messageShouldShowDateChange";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/client.types";
import { InboxId, MessageId } from "@xmtp/react-native-sdk";
import { createContext, memo, useContext, useEffect, useRef } from "react";
import { createStore, useStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

type IMessageContextStoreProps = {
  message: DecodedMessageWithCodecsType;
  previousMessage: DecodedMessageWithCodecsType | undefined;
  nextMessage: DecodedMessageWithCodecsType | undefined;
};

type IMessageContextStoreState = IMessageContextStoreProps & {
  messageId: MessageId;
  hasNextMessageInSeries: boolean;
  hasPreviousMessageInSeries: boolean;
  fromMe: boolean;
  sentAt: number;
  showDateChange: boolean;
  senderAddress: InboxId;
  isHighlighted: boolean;
  isShowingTime: boolean;
};

type IMessageContextStoreProviderProps =
  React.PropsWithChildren<IMessageContextStoreProps>;

type IMessageContextStore = ReturnType<typeof createMessageContextStore>;

export const MessageContextStoreProvider = memo(
  ({ children, ...props }: IMessageContextStoreProviderProps) => {
    const storeRef = useRef<IMessageContextStore>();

    if (!storeRef.current) {
      storeRef.current = createMessageContextStore(props);
    }

    // Make sure to update the store if a props change
    useEffect(() => {
      storeRef.current?.setState({
        ...getStoreStateBasedOnProps(props),
      });
    }, [props]);

    return (
      <MessageContextStoreContext.Provider value={storeRef.current}>
        {children}
      </MessageContextStoreContext.Provider>
    );
  }
);

function getStoreStateBasedOnProps(props: IMessageContextStoreProps) {
  return {
    ...props,
    messageId: props.message.id as MessageId,
    hasNextMessageInSeries: hasNextMessageInSeries({
      currentMessage: props.message,
      nextMessage: props.nextMessage,
    }),
    hasPreviousMessageInSeries: hasPreviousMessageInSeries({
      currentMessage: props.message,
      previousMessage: props.previousMessage,
    }),
    fromMe: messageIsFromCurrentUserV3({
      message: props.message,
    }),
    showDateChange: messageShouldShowDateChange({
      message: props.message,
      previousMessage: props.previousMessage,
    }),
    sentAt: convertNanosecondsToMilliseconds(props.message.sentNs),
    senderAddress: props.message.senderAddress,
    isHighlighted: false,
    isShowingTime: false,
  };
}

const createMessageContextStore = (initProps: IMessageContextStoreProps) => {
  return createStore<IMessageContextStoreState>()(
    subscribeWithSelector((set) => getStoreStateBasedOnProps(initProps))
  );
};

const MessageContextStoreContext = createContext<IMessageContextStore | null>(
  null
);

export function useMessageContextStoreContext<T>(
  selector: (state: IMessageContextStoreState) => T
): T {
  const store = useContext(MessageContextStoreContext);
  if (!store)
    throw new Error("Missing MessageContextStore.Provider in the tree");
  return useStore(store, selector);
}

export function useMessageContextStore() {
  const store = useContext(MessageContextStoreContext);
  if (!store)
    throw new Error(`Missing MessageContextStore.Provider in the tree`);
  return store;
}
