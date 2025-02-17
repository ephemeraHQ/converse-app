import { XMTPError } from "@/utils/error";
import logger from "@/utils/logger";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { InboxId } from "@xmtp/react-native-sdk";

export function isSameInboxId(inboxId1: InboxId, inboxId2: InboxId) {
  return inboxId1.toLowerCase() === inboxId2.toLowerCase();
}

export async function getInboxIdFromAddress(args: {
  currentUserAddress: string;
  targetEthAddress: string;
}) {
  const { currentUserAddress, targetEthAddress } = args;
  const startTime = Date.now();
  try {
    const clientStartTime = Date.now();
    const client = MultiInboxClient.instance.getInboxClientForAddress({
      ethereumAddress: currentUserAddress,
    });
    const clientDuration = Date.now() - clientStartTime;

    if (clientDuration > 2000) {
      logger.warn(
        `[getInboxIdFromAddress] Client lookup took ${clientDuration}ms for address: ${currentUserAddress}`
      );
    }

    const lookupStartTime = Date.now();
    const inboxId = await client.findInboxIdFromAddress(targetEthAddress);
    const lookupDuration = Date.now() - lookupStartTime;

    if (lookupDuration > 1000) {
      logger.warn(
        `[getInboxIdFromAddress] Inbox lookup took ${lookupDuration}ms for target address: ${targetEthAddress}`
      );
    }

    const totalDuration = Date.now() - startTime;
    if (totalDuration > 3000) {
      logger.warn(
        `[getInboxIdFromAddress] Total operation took ${totalDuration}ms (client: ${clientDuration}ms, lookup: ${lookupDuration}ms) for target address: ${targetEthAddress}`
      );
    }

    return inboxId;
  } catch (error) {
    throw new XMTPError("Failed to get inbox ID from address", {
      cause: error,
    });
  }
}
