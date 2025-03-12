import { IXmtpConversationId, IXmtpConversationTopic } from "@/features/xmtp/xmtp.types"

const CONVERSATION_TOPIC_PREFIX = "/xmtp/mls/1/g-"

export const getConversationIdFromTopic = (topic: IXmtpConversationTopic): IXmtpConversationId => {
  return topic.replace(CONVERSATION_TOPIC_PREFIX, "").replace("/proto", "") as IXmtpConversationId
}
