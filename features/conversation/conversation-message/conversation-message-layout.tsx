import { useSelect } from "@/data/store/storeHelpers";
import { HStack } from "@/design-system/HStack";
import { VStack } from "@/design-system/VStack";
import { ConversationMessageSender } from "@/features/conversation/conversation-message/conversation-message-sender";
import { ConversationSenderAvatar } from "@/features/conversation/conversation-message/conversation-message-sender-avatar";
import { useMessageContextStoreContext } from "@/features/conversation/conversation-message/conversation-message.store-context";
import { useConversationMessageStyles } from "@/features/conversation/conversation-message/conversation-message.styles";
import { isGroupUpdatedMessage } from "@/features/conversation/conversation-message/conversation-message.utils";
import { ReactNode, memo } from "react";

type IConversationMessageLayoutProps = {
  reactions?: ReactNode;
  message?: ReactNode;
  messageStatus?: ReactNode;
};

export const ConversationMessageLayout = memo(
  function ConversationMessageLayout({
    message,
    reactions,
    messageStatus,
  }: IConversationMessageLayoutProps) {
    const {
      messageContainerSidePadding,
      spaceBetweenSenderAvatarAndMessage,
      senderAvatarSize,
      spaceBetweenMessageFromDifferentUserOrType,
      spaceBetweenMessagesInSeries,
      spaceBetweenMessageAndSender,
      senderNameLeftMargin,
      spaceBetweenSeriesWithReactions,
    } = useConversationMessageStyles();

    const {
      senderInboxId,
      fromMe,
      hasNextMessageInSeries,
      hasPreviousMessageInSeries,
      isSystemMessage,
      nextMessage,
      message: messageData,
    } = useMessageContextStoreContext(
      useSelect([
        "senderInboxId",
        "fromMe",
        "hasNextMessageInSeries",
        "hasPreviousMessageInSeries",
        "isSystemMessage",
        "nextMessage",
        "message",
      ])
    );

    const isGroupUpdate = isGroupUpdatedMessage(messageData);

    return (
      <VStack
        style={{
          ...(!hasNextMessageInSeries && {
            marginBottom: nextMessage
              ? spaceBetweenMessageFromDifferentUserOrType
              : spaceBetweenMessagesInSeries,
          }),
        }}
      >
        <HStack
          style={{
            width: "100%",
            alignItems: "flex-end",
            ...(!isGroupUpdate && {
              ...(fromMe
                ? {
                    paddingRight: messageContainerSidePadding,
                    justifyContent: "flex-end",
                  }
                : {
                    paddingLeft: messageContainerSidePadding,
                    justifyContent: "flex-start",
                  }),
            }),
          }}
        >
          {!fromMe && !isSystemMessage && (
            <>
              {!hasNextMessageInSeries ? (
                <ConversationSenderAvatar inboxId={senderInboxId} />
              ) : (
                <VStack style={{ width: senderAvatarSize }} />
              )}
              <VStack style={{ width: spaceBetweenSenderAvatarAndMessage }} />
            </>
          )}

          <VStack
            style={{
              alignItems: fromMe ? "flex-end" : "flex-start",
              ...((hasNextMessageInSeries || !!reactions) && {
                marginBottom: spaceBetweenMessagesInSeries,
              }),
            }}
          >
            {!fromMe && !hasPreviousMessageInSeries && !isSystemMessage && (
              <VStack
                style={{
                  flexDirection: "row",
                  marginLeft: senderNameLeftMargin,
                  marginBottom: spaceBetweenMessageAndSender,
                }}
              >
                <ConversationMessageSender inboxId={senderInboxId} />
              </VStack>
            )}

            {message}
          </VStack>
        </HStack>

        {!!reactions && (
          <HStack
            style={{
              ...(hasNextMessageInSeries && {
                marginBottom: spaceBetweenSeriesWithReactions,
              }),
              ...(fromMe
                ? {
                    paddingRight: messageContainerSidePadding,
                    justifyContent: "flex-end",
                  }
                : {
                    paddingLeft:
                      messageContainerSidePadding +
                      spaceBetweenSenderAvatarAndMessage +
                      senderAvatarSize,
                    justifyContent: "flex-start",
                  }),
            }}
          >
            {reactions}
          </HStack>
        )}

        {!!messageStatus && (
          <HStack
            style={{
              paddingRight: messageContainerSidePadding,
              justifyContent: "flex-end",
            }}
          >
            {messageStatus}
          </HStack>
        )}
      </VStack>
    );
  }
);
