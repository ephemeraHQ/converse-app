import {
  PasskeyStamper,
  createPasskey,
  isSupported,
} from "@turnkey/react-native-passkey-stamper";
import { TurnkeyClient } from "@turnkey/http";
import { Buffer } from "buffer";
import { createAccount } from "@turnkey/viem";
import { createTurnkeySubOrganization } from "../api";

const RPID = "dev.converse.xyz";

export async function onPasskeyCreate(passkeyName: string) {
  if (!isSupported()) {
    alert("Passkeys are not supported on this device");
  }

  try {
    const authenticatorParams = await createUserPasskey(passkeyName);
    console.log("passkey registration succeeded: ", authenticatorParams);
    const { walletId, subOrganizationId, address } =
      await createSubOrganization(authenticatorParams);
    alert(`Sub-org created! Your address: ${address}`);
    if (!address) {
      throw new Error("No address found");
    }

    const turnkeyAccount = await createTurnkeyAccount(
      address,
      subOrganizationId!
    );
    console.log({
      address,
      subOrganizationId,
    });
    return turnkeyAccount;
  } catch (e) {
    console.error("error during passkey creation", e);
  }
}

const createUserPasskey = async (passkeyName: string) => {
  // ID isn't visible by users, but needs to be random enough and valid base64 (for Android)
  const userId = Buffer.from(String(Date.now())).toString("base64");
  const authenticatorParams = await createPasskey({
    // This doesn't matter much, it will be the name of the authenticator persisted on the Turnkey side.
    // Won't be visible by default.
    authenticatorName: "End-User Passkey",
    rp: {
      id: RPID,
      name: "Passkey App",
    },
    user: {
      id: userId,
      // ...but name and display names are
      // We insert a human-readable date time for ease of use
      name: passkeyName,
      displayName: passkeyName,
    },
    authenticatorSelection: {
      residentKey: "required",
      requireResidentKey: true,
      userVerification: "preferred",
    },
  });
  return authenticatorParams;
};

export async function getWhoami() {
  const stamper = await new PasskeyStamper({
    rpId: RPID,
  });
  const client = new TurnkeyClient(
    { baseUrl: "https://api.turnkey.com" },
    stamper
  );
  if (!client) {
    throw new Error("No client found");
  }
  const getWhoamiResult = await client.getWhoami({
    organizationId: "ORG_ID",
  });
  const wallets = await client.getWallets({
    organizationId: getWhoamiResult.organizationId,
  });
  console.log("wallets", wallets);
  alert(
    `Successfully logged into sub-organization ${getWhoamiResult.organizationId} with wallet ${getWhoamiResult.userId}`
  );
}

export async function onPasskeySignature() {
  try {
    const stamper = await new PasskeyStamper({
      rpId: RPID,
    });
    const client = new TurnkeyClient(
      { baseUrl: "https://api.turnkey.com" },
      stamper
    );
    if (!client) {
      throw new Error("No client found");
    }
    const subOrg = "TODO";
    const address = "TODO";
    const wallet = await createTurnkeyAccount(address, subOrg);
    console.log("wallet", wallet);
    return wallet;
  } catch (e) {
    console.error("error during passkey signature", e);
  }
}

async function createSubOrganization(
  authenticatorParams: Awaited<ReturnType<typeof createPasskey>>
) {
  const res = await createTurnkeySubOrganization(authenticatorParams);
  return res;
}

const createTurnkeyAccount = async (
  address: string,
  subOrganizationId: string
) => {
  try {
    const stamper = await new PasskeyStamper({
      rpId: RPID,
    });
    const client = new TurnkeyClient(
      { baseUrl: "https://api.turnkey.com" },
      stamper
    );
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
