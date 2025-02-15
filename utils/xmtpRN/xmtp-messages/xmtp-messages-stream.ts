import { XMTPError } from "@/utils/error";
import { isProd } from "@/utils/getEnv";
import { logger } from "@utils/logger";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { DecodedMessageWithCodecsType } from "../xmtp-client/xmtp-client.types";

export const streamAllMessages = async (args: {
  account: string;
  onNewMessage: (message: DecodedMessageWithCodecsType) => void | Promise<void>;
}) => {
  const { account, onNewMessage } = args;

  // Stop before restarting just to be sure
  await stopStreamingAllMessage({ ethAddress: account });

  const client = MultiInboxClient.instance.getInboxClientForAddress({
    ethereumAddress: account,
  });

  logger.debug(
    `[XMTP - streamAllMessages] Streaming messages for ${client.address}`
  );

  try {
    await client.conversations.streamAllMessages(async (message) => {
      logger.debug(
        `[XMTP - streamAllMessages] Received a message for ${
          client.address
        } with id: ${message.id}, text: ${
          isProd ? "Redacted" : message.nativeContent.text
        }, topic: ${message.topic}`
      );

      await onNewMessage(message);
    });
  } catch (error) {
    throw new XMTPError("Failed to stream messages", error);
  }
};

export const stopStreamingAllMessage = async (args: { ethAddress: string }) => {
  const { ethAddress } = args;

  const client = MultiInboxClient.instance.getInboxClientForAddress({
    ethereumAddress: ethAddress,
  });

  try {
    await client.conversations.cancelStreamAllMessages();

    logger.debug(
      `[XMTP - stopStreamingAllMessage] Stopped streaming messages for ${client.address}`
    );
  } catch (error) {
    throw new XMTPError("Failed to cancel message streaming", error);
  }
};
