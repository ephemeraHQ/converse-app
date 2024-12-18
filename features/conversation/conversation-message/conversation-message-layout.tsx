import { useSelect } from "@/data/store/storeHelpers";
import { HStack } from "@/design-system/HStack";
import { AnimatedVStack, VStack } from "@/design-system/VStack";
import { ConversationMessageSender } from "@/features/conversation/conversation-message/conversation-message-sender";
import { ConversationSenderAvatar } from "@/features/conversation/conversation-message/conversation-message-sender-avatar";
import { useMessageContextStoreContext } from "@/features/conversation/conversation-message/conversation-message.store-context";
import { useAppTheme } from "@/theme/useAppTheme";
import { debugBorder } from "@/utils/debug-style";
import { ReactNode, memo } from "react";

type IConversationMessageLayoutProps = {
  children: ReactNode;
};

export const ConversationMessageLayout = memo(
  function ConversationMessageLayout({
    children,
  }: IConversationMessageLayoutProps) {
    const { theme } = useAppTheme();

    const { senderInboxId, fromMe, hasNextMessageInSeries } =
      useMessageContextStoreContext(
        useSelect(["senderInboxId", "fromMe", "hasNextMessageInSeries"])
      );

    return (
      <MessageContainer>
        <MessageContentContainer>
          {!fromMe && (
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
            // {...debugBorder()}
            layout={theme.animation.reanimatedLayoutSpringTransition}
            style={{
              rowGap: theme.spacing["4xs"],
              alignItems: fromMe ? "flex-end" : "flex-start",
            }}
          >
            {!fromMe && !hasNextMessageInSeries && (
              <ConversationMessageSender inboxId={senderInboxId} />
            )}
            {children}
          </AnimatedVStack>
        </MessageContentContainer>
      </MessageContainer>
    );
  }
);

const MessageContentContainer = memo(function MessageContentContainer(props: {
  children: React.ReactNode;
}) {
  const { children } = props;

  const { theme } = useAppTheme();

  const { fromMe } = useMessageContextStoreContext(useSelect(["fromMe"]));

  return (
    <HStack
      style={{
        // ...debugBorder("yellow"),
        alignItems: "flex-end",
        ...(fromMe
          ? { paddingRight: theme.spacing.sm, justifyContent: "flex-end" }
          : { paddingLeft: theme.spacing.sm, justifyContent: "flex-start" }),
      }}
    >
      {children}
    </HStack>
  );
});

const MessageContainer = memo(function MessageContainer(props: {
  children: React.ReactNode;
}) {
  const { children } = props;

  const { fromMe } = useMessageContextStoreContext(useSelect(["fromMe"]));

  return (
    <HStack
      // {...debugBorder()}
      style={{
        width: "100%",
        alignItems: "flex-end",
        ...(fromMe
          ? { justifyContent: "flex-end" }
          : { justifyContent: "flex-start" }),
      }}
    >
      {children}
    </HStack>
  );
});
