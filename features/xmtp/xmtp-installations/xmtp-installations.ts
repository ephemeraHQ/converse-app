import { logger } from "@utils/logger";
import { IXmtpClient } from "@/features/xmtp/xmtp.types";

export const getOtherInstallations = async (args: { client: IXmtpClient }) => {
  const { client } = args;

  const inboxState = await client.inboxState(true);
  const installationIds = inboxState.installations.map((i) => i.id);

  logger.debug(
    `[getOtherInstallations] Current: ${client.installationId}, All: ${installationIds}`,
  );

  const otherInstallations = installationIds.filter(
    (id) => id !== client.installationId,
  );

  return otherInstallations;
};

export async function validateClientInstallation(args: {
  client: IXmtpClient;
}) {
  const { client } = args;
  const inboxState = await client.inboxState(true);
  const installationsIds = inboxState.installations.map((i) => i.id);

  logger.debug(
    `[validateClientInstallation] Current installation: ${client.installationId}, All installations: ${installationsIds}`,
  );

  return installationsIds.includes(client.installationId);
}
