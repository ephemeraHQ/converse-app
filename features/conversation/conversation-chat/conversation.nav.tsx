import { IXmtpConversationId, IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { ConversationScreen } from "@/features/conversation/conversation-chat/conversation.screen"
import { translate } from "@/i18n"
import { AppNativeStack } from "@/navigation/app-navigator"
import { logger } from "@/utils/logger"

export type ConversationNavParams = {
  xmtpConversationId?: IXmtpConversationId
  composerTextPrefill?: string
  searchSelectedUserInboxIds?: IXmtpInboxId[]
  isNew?: boolean
}

export const ConversationScreenConfig = {
  path: "/conversation/:inboxId?",
  parse: {
    inboxId: (value: string | undefined) => {
      if (!value) return undefined;
      
      const inboxId = decodeURIComponent(value) as IXmtpInboxId;
      logger.info(`Parsing inboxId from URL: ${inboxId}`);
      return inboxId;
    },
    composerTextPrefill: (value: string | undefined) => {
      if (!value) return undefined;
      
      const text = decodeURIComponent(value);
      logger.info(`Parsing composerTextPrefill from URL: ${text}`);
      return text;
    }
  },
  stringify: {
    inboxId: (value: IXmtpInboxId | undefined) => value ? encodeURIComponent(String(value)) : "",
    composerTextPrefill: (value: string | undefined) => value ? encodeURIComponent(value) : "",
  }
}

export function ConversationNav() {
  return (
    <AppNativeStack.Screen
      options={{
        title: "",
        headerTitle: translate("chat"),
      }}
      name="Conversation"
      component={ConversationScreen}
    />
  )
}
