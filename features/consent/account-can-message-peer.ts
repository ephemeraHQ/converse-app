import logger from "@utils/logger";
import { ConverseXmtpClientType } from "@/utils/xmtpRN/client/client.types";
import { getXmtpClient } from "@/utils/xmtpRN/sync";

type AccountCanMessagePeerArgs = {
  account: string;
  peer: string;
};

export const accountCanMessagePeer = async (
  args: AccountCanMessagePeerArgs
) => {
  const { peer, account } = args;
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;

  if (!client) {
    throw new Error("Client not found");
  }

  logger.debug(`[XMTPRN Conversations] Checking if can message ${peer}`);
  const start = new Date().getTime();

  const canMessage = await client.canMessage([peer]);

  const end = new Date().getTime();
  logger.debug(
    `[XMTPRN Conversations] Checked if can message ${peer} in ${
      (end - start) / 1000
    } sec`
  );

  return canMessage[peer.toLowerCase()];
};
