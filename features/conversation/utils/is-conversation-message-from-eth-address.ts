import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/client.types";
import { getInboxId } from "@/utils/xmtpRN/signIn";

export async function isConversationMessageFromEthAddress(args: {
  message: DecodedMessageWithCodecsType;
  ethAddress: string;
}) {
  const { message, ethAddress } = args;
  const inboxId = await getInboxId(ethAddress);
  return message.senderInboxId.toLowerCase() === inboxId.toLowerCase();
}
