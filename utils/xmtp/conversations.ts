import { Client, Conversation, dateToNs } from "../../vendor/xmtp-js/src";
import {
  ConversationV1,
  ConversationV2,
} from "../../vendor/xmtp-js/src/conversations";
import { InviteStore } from "../../vendor/xmtp-js/src/keystore";

export const parseConversationJSON = async (
  xmtpClient: Client,
  savedConversation: string
): Promise<Conversation> => {
  let parsedConversation: any = {};
  try {
    parsedConversation = JSON.parse(savedConversation);
  } catch (e: any) {
    console.log(e);
    throw new Error("Could not parse saved conversation");
  }
  if (parsedConversation.version === "v1") {
    const conversationV1 = new ConversationV1(
      xmtpClient,
      parsedConversation.peerAddress,
      new Date(parsedConversation.createdAt)
    );
    return conversationV1;
  } else if (parsedConversation.version === "v2") {
    // Let's add the key material to the keystore
    const inviteStore = (xmtpClient.keystore as any).inviteStore as InviteStore;
    await inviteStore.add([
      {
        createdNs: dateToNs(new Date(parsedConversation.createdAt)),
        peerAddress: parsedConversation.peerAddress,
        invitation: {
          topic: parsedConversation.topic,
          context: parsedConversation.context,
          aes256GcmHkdfSha256: {
            keyMaterial: Buffer.from(parsedConversation.keyMaterial, "base64"),
          },
        },
      },
    ]);

    const conversationV2 = new ConversationV2(
      xmtpClient,
      parsedConversation.topic,
      parsedConversation.peerAddress,
      new Date(parsedConversation.createdAt),
      parsedConversation.context
    );
    return conversationV2;
  }
  throw new Error(
    `Conversation version ${parsedConversation.version} not handled`
  );
};
