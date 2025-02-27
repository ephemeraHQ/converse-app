import { xmtpLogger } from "@utils/logger";
import { XMTPError } from "@/utils/error";
import { isProd } from "@/utils/getEnv";
import { getXmtpClientByEthAddress } from "../xmtp-client/xmtp-client.service";
import { IXmtpDecodedMessage } from "../xmtp.types";

export const streamAllMessages = async (args: {
  account: string;
  onNewMessage: (message: IXmtpDecodedMessage) => void | Promise<void>;
}) => {
  const { account, onNewMessage } = args;

  const client = await getXmtpClientByEthAddress({
    ethAddress: account,
  });

  xmtpLogger.debug(`Streaming messages for ${client.address}`);

  try {
    await client.conversations.streamAllMessages(async (message) => {
      xmtpLogger.debug(
        `Received message for ${client.address} with id: ${message.id}, text: ${
          isProd ? "Redacted" : message.nativeContent.text
        }, topic: ${message.topic}`,
      );

      await onNewMessage(message);
    });
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "failed to stream messages",
    });
  }
};

export const stopStreamingAllMessage = async (args: { ethAddress: string }) => {
  const { ethAddress } = args;

  const client = await getXmtpClientByEthAddress({
    ethAddress: ethAddress,
  });

  try {
    await client.conversations.cancelStreamAllMessages();

    xmtpLogger.debug(`Stopped streaming messages for ${client.address}`);
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "failed to cancel message streaming",
    });
  }
};
