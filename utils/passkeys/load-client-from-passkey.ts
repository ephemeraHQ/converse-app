import { RPID } from "./passkeys.constants";
import { createTurnkeyAccountFromWalletId } from "./create-turnkey-account";
import { TurnkeyStoreInfo } from "./passkeys.interfaces";
import { PasskeyStamper } from "@turnkey/react-native-passkey-stamper";
import { TurnkeyClient } from "@turnkey/http";
import { setTurnkeyClient } from "./turnkey-clients";
import config from "@/config";

type LoadAccountFromPasskeyParams = {
  setStatusString: (statusString: string) => void;
  setPreviousPasskeyName: (passkeyName: string) => void;
  setTurnkeyInfo: (turnkeyInfo: TurnkeyStoreInfo) => void;
};

export const loadAccountFromPasskey = async ({
  setStatusString,
  setTurnkeyInfo,
}: LoadAccountFromPasskeyParams) => {
  try {
    setStatusString("Loading passkey...");

    const stamper = await new PasskeyStamper({
      rpId: RPID,
    });
    const client = new TurnkeyClient(
      { baseUrl: "https://api.turnkey.com" },
      stamper
    );
    setStatusString("Logging in...");
    const getWhoamiResult = await client.getWhoami({
      organizationId: config.turnkeyOrg,
    });

    setStatusString("Getting wallets...");

    const subOrganizationId = getWhoamiResult.organizationId;
    setTurnkeyClient(subOrganizationId, client);

    const getWallets = await client.getWallets({
      organizationId: subOrganizationId,
    });

    // TODO: Is there a better way to find the embedded wallet?
    const embeddedWallet = getWallets.wallets.find(
      (wallet) => wallet.walletName === "Embedded Wallet"
    );
    if (!embeddedWallet) {
      throw new Error("No embedded wallet found");
    }
    const walletId = embeddedWallet?.walletId;

    setStatusString("Creating account...");
    setTurnkeyInfo({
      subOrganizationId,
      walletId: embeddedWallet.walletId,
      address: "",
    });
    const account = await createTurnkeyAccountFromWalletId(
      walletId,
      subOrganizationId
    );
    setStatusString("Account created");
    return {
      account,
      turnkeyInfo: { subOrganizationId, walletId, address: "" },
    };
  } catch (e) {
    console.error("error during passkey load", e);
    throw e;
  }
};
