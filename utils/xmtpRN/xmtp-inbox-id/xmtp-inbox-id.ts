import { XMTPError } from "@/utils/error";
import logger from "@/utils/logger";
import { getXmtpClient } from "@/utils/xmtpRN/xmtp-client/xmtp-client";
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
    const client = await getXmtpClient({
      address: currentUserAddress,
    });

    const inboxId = await client.findInboxIdFromAddress(targetEthAddress);

    const duration = Date.now() - startTime;

    if (duration > 3000) {
      logger.warn(
        `[getInboxIdFromAddress] Took ${duration}ms to get inboxId for address: ${targetEthAddress}`
      );
    }

    return inboxId;
  } catch (error) {
    throw new XMTPError("Failed to get inbox ID from address", {
      cause: error,
    });
  }
}
