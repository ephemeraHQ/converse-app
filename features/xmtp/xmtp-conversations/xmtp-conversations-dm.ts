import { InboxId } from "@xmtp/react-native-sdk";
import { captureError } from "@/utils/capture-error";
import { XMTPError } from "@/utils/error";
import { XMTP_MAX_MS_UNTIL_LOG_ERROR } from "../utils/xmtp-logs";
import { getXmtpClientByEthAddress } from "../xmtp-client/xmtp-client.service";

export async function getXmtpDmByInboxId(args: {
  ethAccountAddress: string;
  inboxId: InboxId;
}) {
  const { ethAccountAddress, inboxId } = args;
  const startTime = Date.now();

  try {
    const client = await getXmtpClientByEthAddress({
      ethereumAddress: ethAccountAddress,
    });

    const conversation = await client.conversations.findDmByInboxId(inboxId);

    const duration = Date.now() - startTime;
    if (duration > XMTP_MAX_MS_UNTIL_LOG_ERROR) {
      captureError(
        new XMTPError({
          error: new Error(
            `Getting conversation by inboxId took ${duration}ms for inboxId: ${inboxId}`,
          ),
        }),
      );
    }

    return conversation;
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: `Failed to get conversation for inbox ID: ${inboxId}`,
    });
  }
}

export async function createXmtpDm(args: {
  senderEthAddress: string;
  peerInboxId: InboxId;
}) {
  const { senderEthAddress, peerInboxId } = args;
  const startTime = Date.now();

  try {
    const client = await getXmtpClientByEthAddress({
      ethereumAddress: senderEthAddress,
    });

    const conversation =
      await client.conversations.findOrCreateDmWithInboxId(peerInboxId);

    const duration = Date.now() - startTime;
    if (duration > XMTP_MAX_MS_UNTIL_LOG_ERROR) {
      captureError(
        new XMTPError({
          error: new Error(
            `Creating DM took ${duration}ms for inboxId: ${peerInboxId}`,
          ),
        }),
      );
    }

    return conversation;
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: `Failed to create XMTP DM with inbox ID: ${peerInboxId}`,
    });
  }
}
