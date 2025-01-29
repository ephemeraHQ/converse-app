import { Signer } from "ethers";
import { Alert } from "react-native";

import { prefetchInboxIdQuery } from "@/queries/inbox-id-query";
import {
  getSettingsStore,
  getWalletStore,
  useAccountsStore,
} from "@data/store/accountsStore";
import { translate } from "@i18n";
import { awaitableAlert } from "@utils/alert";
import logger from "@utils/logger";
import { logoutAccount, waitForLogoutTasksDone } from "@utils/logout";
import { sentryTrackMessage } from "@utils/sentry";
import {
  createXmtpClientFromSigner,
  createXmtpClientFromViemAccount,
} from "@/utils/xmtpRN/signIn";
import { getXmtpClient } from "@/utils/xmtpRN/xmtp-client/xmtp-client";
import { ViemAccount } from "@/utils/xmtpRN/signer";

export async function initXmtpClient(args: {
  signer: Signer;
  address: string;
  privyAccountId?: string;
  isEphemeral?: boolean;
  pkPath?: string;
}) {
  const { signer, address, ...restArgs } = args;
  logger.debug(
    `[initXmtpClient] Starting with args: ${JSON.stringify({ address, ...restArgs }, null, 2)}`
  );

  if (!signer || !address) {
    logger.error("[initXmtpClient] Missing required params");
    throw new Error("No signer or address");
  }

  try {
    logger.debug("[initXmtpClient] Creating XMTP client from signer");
    await createXmtpClientFromSigner(signer, async () => {
      logger.debug("[initXmtpClient] Installation revoked, showing alert");
      await awaitableAlert(
        translate("current_installation_revoked"),
        translate("current_installation_revoked_description")
      );
      throw new Error("Current installation revoked");
    });

    logger.debug("[initXmtpClient] Connecting with address");
    await connectWithAddress({
      address,
      ...restArgs,
    });
  } catch (e) {
    logger.error(`[initXmtpClient] Error: ${JSON.stringify(e, null, 2)}`);
    await logoutAccount({ account: address });
    throw e;
  }
}

export async function initXmtpClientFromViemAccount(args: {
  account: ViemAccount;
  privyAccountId?: string;
  isEphemeral?: boolean;
  pkPath?: string;
}) {
  const { account, ...restArgs } = args;
  logger.debug(
    `[initXmtpClientFromViemAccount] Starting with args: ${JSON.stringify({ account: account.address, ...restArgs }, null, 2)}`
  );

  if (!account) {
    logger.error("[initXmtpClientFromViemAccount] No account provided");
    throw new Error("No signer");
  }

  const { address } = account;

  if (!address) {
    logger.error("[initXmtpClientFromViemAccount] No address in account");
    throw new Error("No address");
  }

  try {
    logger.debug(
      "[initXmtpClientFromViemAccount] Creating XMTP client from Viem account"
    );
    await createXmtpClientFromViemAccount(account, async () => {
      logger.debug(
        "[initXmtpClientFromViemAccount] Installation revoked, showing alert"
      );
      await awaitableAlert(
        translate("current_installation_revoked"),
        translate("current_installation_revoked_description")
      );
      throw new Error("Current installation revoked");
    });

    logger.debug("[initXmtpClientFromViemAccount] Connecting with address");
    await connectWithAddress({
      address,
      ...restArgs,
    });
  } catch (e) {
    logger.error(
      `[initXmtpClientFromViemAccount] Error: ${JSON.stringify(e, null, 2)}`
    );
    await logoutAccount({ account: address });
    throw e;
  }
}

type IBaseArgs = {
  address: string;
};

type IPrivyArgs = IBaseArgs & {
  privyAccountId: string;
};

type IEphemeralArgs = IBaseArgs & {
  isEphemeral: true;
};

type IPrivateKeyArgs = IBaseArgs & {
  pkPath: string;
};

type IStandardArgs = IBaseArgs;

type IConnectWithAddressKeyArgs =
  | IPrivyArgs
  | IEphemeralArgs
  | IPrivateKeyArgs
  | IStandardArgs;

export async function connectWithAddress(args: IConnectWithAddressKeyArgs) {
  const { address } = args;
  logger.debug(
    `[connectWithAddress] Starting with args: ${JSON.stringify(args, null, 2)}`
  );

  if (!address) {
    logger.error("[connectWithAddress] No address provided");
    sentryTrackMessage("Could not connect because no address");
    return;
  }

  try {
    logger.debug("[connectWithAddress] Performing logout and saving key");
    await performLogoutAndSaveKey(address);

    logger.debug("[connectWithAddress] Setting current account");
    useAccountsStore.getState().setCurrentAccount(address, true);

    logger.debug("[connectWithAddress] Finalizing account setup");
    await finalizeAccountSetup(args);

    logger.debug("[connectWithAddress] Connection completed successfully");
    sentryTrackMessage("Connecting done!");
  } catch (e) {
    logger.error(`[connectWithAddress] Error: ${JSON.stringify(e, null, 2)}`, {
      context: "Onboarding - connectWithAddress",
    });
    Alert.alert(translate("onboarding_error"));
    throw e;
  }
}

async function performLogoutAndSaveKey(address: string) {
  logger.debug(`[performLogoutAndSaveKey] Starting for address: ${address}`);
  logger.debug("[performLogoutAndSaveKey] Waiting for logout tasks");
  await waitForLogoutTasksDone(500);
  logger.debug("[performLogoutAndSaveKey] Logout tasks completed");
  logger.debug("[performLogoutAndSaveKey] XMTP Key saved");
}

async function finalizeAccountSetup(args: IConnectWithAddressKeyArgs) {
  logger.debug(
    `[finalizeAccountSetup] Starting with args: ${JSON.stringify(args, null, 2)}`
  );

  const { address } = args;

  logger.debug(`[finalizeAccountSetup] Setting current account: ${address}`);
  useAccountsStore.getState().setCurrentAccount(address, false);

  const isEphemeral = "isEphemeral" in args && args.isEphemeral;
  logger.debug(
    `[finalizeAccountSetup] Setting ephemeral account status: ${isEphemeral}`
  );
  getSettingsStore(address).getState().setEphemeralAccount(isEphemeral);

  if ("pkPath" in args) {
    logger.debug(
      `[finalizeAccountSetup] Setting private key path: ${args.pkPath}`
    );
    getWalletStore(address).getState().setPrivateKeyPath(args.pkPath);
  }

  logger.debug("[finalizeAccountSetup] Prefetching inbox ID");
  await prefetchInboxIdQuery({ account: address });

  logger.debug("[finalizeAccountSetup] Getting XMTP client");
  getXmtpClient({ address });

  logger.debug("[finalizeAccountSetup] Account setup completed");
}
