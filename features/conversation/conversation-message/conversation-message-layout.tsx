import { useSelect } from "@/data/store/storeHelpers";
import { HStack } from "@/design-system/HStack";
import { AnimatedVStack, VStack } from "@/design-system/VStack";
import { ConversationMessageSender } from "@/features/conversation/conversation-message/conversation-message-sender";
import { ConversationSenderAvatar } from "@/features/conversation/conversation-message/conversation-message-sender-avatar";
import { useMessageContextStoreContext } from "@/features/conversation/conversation-message/conversation-message.store-context";
import { useAppTheme } from "@/theme/useAppTheme";
import { ReactNode, memo } from "react";

type IConversationMessageLayoutProps = {
  children: ReactNode;
};

export const ConversationMessageLayout = memo(
  function ConversationMessageLayout({
    children,
  }: IConversationMessageLayoutProps) {
    const { theme } = useAppTheme();

    const {
      senderInboxId,
      fromMe,
      hasNextMessageInSeries,
      hasPreviousMessageInSeries,
      isSystemMessage,
    } = useMessageContextStoreContext(
      useSelect([
        "senderInboxId",
        "fromMe",
        "hasNextMessageInSeries",
        "hasPreviousMessageInSeries",
        "isSystemMessage",
      ])
    );

    return (
      <MessageContainer>
        {!fromMe && !isSystemMessage && (
          <>
            {!hasNextMessageInSeries ? (
              <ConversationSenderAvatar inboxId={senderInboxId} />
            ) : (
              <VStack style={{ width: theme.avatarSize.sm }} />
            )}
            <VStack style={{ width: theme.spacing.xxs }} />
          </>
        )}
        <AnimatedVStack
          style={{
            rowGap: theme.spacing["4xs"],
            alignItems: fromMe ? "flex-end" : "flex-start",
          }}
        >
          {!fromMe && !hasPreviousMessageInSeries && !isSystemMessage && (
            <ConversationMessageSender inboxId={senderInboxId} />
          )}
          {children}
        </AnimatedVStack>
      </MessageContainer>
    );
  }
);

const MessageContainer = memo(function MessageContainer(props: {
  children: React.ReactNode;
}) {
  const { children } = props;
  const { theme } = useAppTheme();
  const { fromMe, nextMessage, hasNextMessageInSeries } =
    useMessageContextStoreContext(
      useSelect(["fromMe", "nextMessage", "hasNextMessageInSeries"])
    );

  return (
    <HStack
      style={{
        width: "100%",
        alignItems: "flex-end",
        ...(fromMe
          ? {
              paddingRight: theme.spacing.sm,
              justifyContent: "flex-end",
            }
          : {
              paddingLeft: theme.spacing.sm,
              justifyContent: "flex-start",
            }),
        ...(!hasNextMessageInSeries &&
          nextMessage && {
            marginBottom: theme.spacing.sm,
          }),
      }}
    >
      {children}
    </HStack>
  );
});
