import { createAccount } from "@turnkey/viem";
import { getOrCreateTurnkeyClient } from "./turnkey-clients";

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
    const client = getOrCreateTurnkeyClient(subOrganizationId);

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

export const createTurnkeyAccountFromWalletId = async (
  walletId: string,
  subOrganizationId: string
) => {
  try {
    const client = getOrCreateTurnkeyClient(subOrganizationId);

    const account = await client.getWalletAccounts({
      organizationId: subOrganizationId,
      walletId,
    });
    const address = account.accounts[0].address;

    return createTurnkeyAccount(address, subOrganizationId);
  } catch (e) {
    console.error("error during turnkey account creation", e);
    throw e;
  }
};
