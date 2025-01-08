import { PasskeyStamper } from "@turnkey/react-native-passkey-stamper";
import { RPID } from "./passkeys.constants";
import { TurnkeyClient } from "@turnkey/http";
import { getTurnkeyClient, setTurnkeyClient } from "./turnkey-clients";
import { createTurnkeyAccount } from "./create-turnkey-account";
import { v4 as uuidv4 } from "uuid";

type AddWalletToPasskeyParams = {
  subOrgId: string;
  setStatusString: (statusString: string) => void;
};

export const addWalletToPasskey = async ({
  subOrgId,
  setStatusString,
}: AddWalletToPasskeyParams) => {
  setStatusString("Adding wallet to passkey. Creating Passkey Stamper...");
  let client = getTurnkeyClient(subOrgId);
  if (!client) {
    const stamper = new PasskeyStamper({
      rpId: RPID,
    });
    client = new TurnkeyClient({ baseUrl: "https://api.turnkey.com" }, stamper);
    setTurnkeyClient(subOrgId, client);
  }

  const res = await client.createWallet({
    type: "ACTIVITY_TYPE_CREATE_WALLET",
    timestampMs: Date.now().toString(),
    organizationId: subOrgId,
    parameters: {
      walletName: "Wallet " + uuidv4(),
      accounts: [
        {
          curve: "CURVE_SECP256K1",
          pathFormat: "PATH_FORMAT_BIP32",
          path: "m/44'/60'/0'/0/0",
          addressFormat: "ADDRESS_FORMAT_ETHEREUM",
        },
      ],
    },
  });
  setStatusString("Successfully added wallet to passkey");
  const address = res.activity.result.createWalletResult?.addresses[0];
  if (!address) {
    throw new Error("No address found");
  }
  const account = await createTurnkeyAccount(address, subOrgId);
  return { address, account };
};
