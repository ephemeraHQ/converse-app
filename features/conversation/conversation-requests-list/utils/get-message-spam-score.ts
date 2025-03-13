import { URL_REGEX } from "@utils/regex"
import {
  isRemoteAttachmentMessage,
  isStaticAttachmentMessage,
  isTextMessage,
} from "@/features/conversation/conversation-chat/conversation-message/conversation-message.utils"
import { IConversationMessage } from "../../conversation-chat/conversation-message/conversation-message.types"

export function getMessageSpamScore(args: { message: IConversationMessage }) {
  const { message } = args

  let spamScore = 0

  // Reset regex lastIndex to avoid stateful behavior between tests
  URL_REGEX.lastIndex = 0

  if (isTextMessage(message)) {
    const content = message.content()

    if (typeof content === "string") {
      if (URL_REGEX.test(content)) {
        spamScore += 1
      }
      if (content.includes("$")) {
        spamScore += 1
      }
    }
  }

  // For safety for now all attachments are spam
  if (isRemoteAttachmentMessage(message)) {
    spamScore += 1
  }

  // For safety for now all attachments are spam
  if (isStaticAttachmentMessage(message)) {
    spamScore += 1
  }

  return spamScore
}
