import { translate } from "@i18n";
import { awaitableAlert } from "@utils/alert";
import logger from "@utils/logger";
import { Client } from "@xmtp/react-native-sdk";
import { Signer } from "ethers";

export const getOtherInstallations = async (client: Client<any>) => {
  const inboxState = await client.inboxState(true);
  const installationsIds = inboxState.installations.map((i) => i.id);
  logger.debug(
    `Current installation id : ${client.installationId} - All installation ids : ${installationsIds}`
  );
  const otherInstallations = installationsIds.filter(
    (installationId) => installationId !== client.installationId
  );
  return otherInstallations;
};

export const revokeOtherInstallations = async (
  signer: Signer,
  client: Client<any>,
  otherInstallationsCount: number
) => {
  if (otherInstallationsCount === 0) return false;
  logger.warn(
    `Inbox ${client.inboxId} has ${otherInstallationsCount} installations to revoke`
  );
  // We're on a mobile wallet so we need to ask the user first
  const doRevoke = await awaitableAlert(
    translate("other_installations_count", {
      count: otherInstallationsCount,
    }),
    translate("revoke_description"),
    "Yes",
    "No"
  );
  if (!doRevoke) {
    logger.debug(`[Onboarding] User decided not to revoke`);
    return false;
  }
  logger.debug(
    `[Onboarding] User decided to revoke ${otherInstallationsCount} installation`
  );
  await client.revokeAllOtherInstallations(signer);
  logger.debug(`[Onboarding] Installations revoked.`);
  return true;
};
