import logger from "@/utils/logger";
import { subscribedOnceByInboxId } from "./subscribedOnceByAccount";
import { subscribingByInboxId } from "./subscribingByAccount";
import { InboxId } from "@xmtp/react-native-sdk";
export const deleteSubscribedTopics = ({ inboxId }: { inboxId: InboxId }) => {
  if (!inboxId) {
    logger.error("No inboxId provided to deleteSubscribedTopics");
    return;
  }
  if (inboxId in subscribedOnceByInboxId) {
    delete subscribedOnceByInboxId[inboxId];
  }
  if (inboxId in subscribingByInboxId) {
    delete subscribingByInboxId[inboxId];
  }
};
