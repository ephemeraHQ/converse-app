import { ConsentState, Conversation } from "@xmtp/react-native-sdk";
import { captureError } from "@/utils/capture-error";
import { XMTPError } from "@/utils/error";
import { getXmtpClientByEthAddress } from "../xmtp-client/xmtp-client.service";

export async function syncAllConversations(
  ethAddress: string,
  consentStates: ConsentState[],
) {
  try {
    const client = await getXmtpClientByEthAddress({
      ethAddress: ethAddress,
    });

    const beforeSync = new Date().getTime();
    await client.conversations.syncAllConversations(consentStates);
    const afterSync = new Date().getTime();

    const timeDiff = afterSync - beforeSync;
    if (timeDiff > 3000) {
      captureError(
        new XMTPError({
          error: new Error(
            `Syncing conversations from network took ${timeDiff}ms for account ${ethAddress}`,
          ),
        }),
      );
    }
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: `Error syncing all conversations for account ${ethAddress} and consent states ${consentStates.map((c) => c.toString()).join(", ")}`,
    });
  }
}

export async function syncConversation(args: { conversation: Conversation }) {
  const { conversation } = args;

  try {
    const beforeSync = new Date().getTime();
    await conversation.sync();
    const afterSync = new Date().getTime();

    const timeDiff = afterSync - beforeSync;
    if (timeDiff > 3000) {
      captureError(
        new XMTPError({
          error: new Error(
            `Syncing conversation took ${timeDiff}ms for topic ${conversation.topic}`,
          ),
        }),
      );
    }
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: `Error syncing conversation ${conversation.topic}`,
    });
  }
}
