import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { ConversationScreen } from "@/features/conversation/conversation-chat/conversation.screen"
import { translate } from "@/i18n"
import { AppNativeStack } from "@/navigation/app-navigator"
import { IConversationTopic } from "../conversation.types"

export type ConversationNavParams = {
  topic?: IConversationTopic
  composerTextPrefill?: string
  searchSelectedUserInboxIds?: IXmtpInboxId[]
  isNew?: boolean
}

export const ConversationScreenConfig = {
  path: "/conversation",
  parse: {
    topic: decodeURIComponent,
  },
  stringify: {
    topic: encodeURIComponent,
  },
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
