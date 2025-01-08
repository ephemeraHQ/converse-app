import { PasskeyStamper } from "@turnkey/react-native-passkey-stamper";
import { RPID } from "./passkeys.constants";
import { TurnkeyClient } from "@turnkey/http";
import { createAccount } from "@turnkey/viem";
import { getTurnkeyClient, setTurnkeyClient } from "./turnkey-clients";

/**
 * Creates a Viem account from Turnkey given sub-organization ID and address.
 * @param address - The Ethereum address to create the account for.
 * @param subOrganizationId - The sub-organization ID to create the account for.
 * @returns The created Turnkey account.
 */
export const createTurnkeyAccount = async (
  address: string,
  subOrganizationId: string
) => {
  try {
    let client = getTurnkeyClient(subOrganizationId);
    if (!client) {
      const stamper = new PasskeyStamper({
        rpId: RPID,
      });
      client = new TurnkeyClient(
        { baseUrl: "https://api.turnkey.com" },
        stamper
      );
      setTurnkeyClient(subOrganizationId, client);
    }

    const account = await createAccount({
      client,
      organizationId: subOrganizationId,
      signWith: address,
      ethereumAddress: address,
    });

    return account;
  } catch (e) {
    console.error("error during turnkey account creation", e);
    throw e;
  }
};
