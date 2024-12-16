import { useSelect } from "@/data/store/storeHelpers";
import { AnimatedVStack, VStack } from "@/design-system/VStack";
import { MessageContainer } from "@/features/conversation/conversation-message/conversation-message-container";
import { MessageContentContainer } from "@/features/conversation/conversation-message/conversation-message-content-container";
import { V3MessageSenderAvatar } from "@/features/conversation/conversation-message/conversation-message-sender-avatar";
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

    const { senderAddress, fromMe, hasNextMessageInSeries } =
      useMessageContextStoreContext(
        useSelect(["senderAddress", "fromMe", "hasNextMessageInSeries"])
      );

    return (
      <MessageContainer>
        <MessageContentContainer>
          {!fromMe && (
            <>
              {!hasNextMessageInSeries ? (
                <V3MessageSenderAvatar inboxId={senderAddress} />
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
            {children}
          </AnimatedVStack>
        </MessageContentContainer>
      </MessageContainer>
    );
  }
);
