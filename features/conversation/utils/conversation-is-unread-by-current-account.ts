import { normalizeTimestampToMs } from "@/utils/date";

export function conversationIsUnread(args: {
  lastMessageSent: number;
  readUntil: number;
}) {
  const { lastMessageSent, readUntil } = args;

  const timestamp = normalizeTimestampToMs(lastMessageSent);

  // Return true if the last message timestamp is greater than readUntil
  return (readUntil ?? 0) < (timestamp ?? 0);
}
