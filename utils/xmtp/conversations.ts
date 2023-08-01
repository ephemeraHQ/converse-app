import { sendMessageToWebview } from "../../components/XmtpWebview";
import { ConversationEntity as DbConversation } from "../../data/db/entities/conversationEntity";
import {
  Client,
  Conversation,
  InvitationContext,
  dateToNs,
} from "../../vendor/xmtp-js/src";
import {
  ConversationV1,
  ConversationV2,
} from "../../vendor/xmtp-js/src/conversations";
import { InviteStore } from "../../vendor/xmtp-js/src/keystore";
import { sentryTrackMessage } from "../sentry";

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

export const createConversation = (
  dbConversation: DbConversation
): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!dbConversation.pending) {
      reject(new Error("Can only create a conversation that is pending"));
      return;
    }
    console.log(
      `[XMTP] Creating a conversation with peer ${dbConversation.peerAddress} and id ${dbConversation.contextConversationId}`
    );
    let context: InvitationContext | undefined = undefined;
    if (dbConversation.contextConversationId) {
      context = {
        conversationId: dbConversation.contextConversationId,
        metadata: dbConversation.contextMetadata
          ? JSON.parse(dbConversation.contextMetadata)
          : {},
      };
    }
    sendMessageToWebview(
      "CREATE_CONVERSATION",
      { peerAddress: dbConversation.peerAddress, context },
      async (createConversationResult: any) => {
        if (
          createConversationResult?.status !== "SUCCESS" ||
          createConversationResult?.conversationTopic === undefined
        ) {
          sentryTrackMessage("CANT_CREATE_CONVO", {
            peerAddress: dbConversation.peerAddress,
            context,
            error: createConversationResult,
          });
          reject(
            new Error(
              JSON.stringify({
                peerAddress: dbConversation.peerAddress,
                context,
                error: createConversationResult,
              })
            )
          );
          return;
        }
        // Conversation is created!
        const newConversationTopic = createConversationResult.conversationTopic;
        resolve(newConversationTopic);
      }
    );
  });
