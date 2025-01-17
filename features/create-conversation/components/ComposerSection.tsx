import React from "react";
import { View } from "react-native";
import { useAppTheme } from "@/theme/useAppTheme";
import { createConversationStyles } from "../create-conversation.styles";
import { ComposerSectionProps } from "../create-conversation.types";
import { ConversationComposer } from "@/features/conversation/conversation-composer/conversation-composer";
import { ConversationComposerContainer } from "@/features/conversation/conversation-composer/conversation-composer-container";
import { ConversationComposerStoreProvider } from "@/features/conversation/conversation-composer/conversation-composer.store-context";
import { ConversationKeyboardFiller } from "@/features/conversation/conversation-keyboard-filler";

/**
 * Composer section for creating new conversations
 * Includes the message composer and keyboard handling
 *
 * @param props.disabled - Whether the composer is disabled
 * @param props.conversationMode - The type of conversation being created
 * @param props.onSend - Callback when a message is sent
 */
export function ComposerSection({
  disabled,
  conversationMode,
  onSend,
}: ComposerSectionProps) {
  const { themed } = useAppTheme();

  return (
    <View style={themed(createConversationStyles.$composerSection)}>
      <ConversationComposerStoreProvider
        storeName={`new-conversation-${conversationMode}`}
      >
        <ConversationComposerContainer>
          <ConversationComposer
            hideAddAttachmentButton
            disabled={disabled}
            onSend={async (params) => {
              const messageText = params.content?.text?.trim();
              if (!messageText) return;
              await onSend({ text: messageText });
            }}
          />
        </ConversationComposerContainer>
      </ConversationComposerStoreProvider>
      <ConversationKeyboardFiller
        messageContextMenuIsOpen={false}
        enabled={true}
      />
    </View>
  );
}
