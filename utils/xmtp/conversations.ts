import { Client, Conversation, dateToNs } from "@xmtp/xmtp-js";
import {
  ConversationV2 as ConversationV2Type,
  ConversationV1 as ConversationV1Type,
} from "@xmtp/xmtp-js/dist/types/src/conversations";
import { InviteStore } from "@xmtp/xmtp-js/dist/types/src/keystore";

const {
  ConversationV1,
  ConversationV2,
} = require("@xmtp/xmtp-js/dist/esm/src/conversations/Conversation");

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
    const conversationV1: ConversationV1Type = new ConversationV1(
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

    const conversationV2: ConversationV2Type = new ConversationV2(
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
