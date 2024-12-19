import {
  PasskeyStamper,
  createPasskey,
  isSupported,
} from "@turnkey/react-native-passkey-stamper";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { TurnkeyClient } from "@turnkey/http";
import { Buffer } from "buffer";
import { v4 as uuidv4 } from "uuid";
import { createAccountWithAddress } from "@turnkey/viem";

const RPID = "dev.converse.xyz";
const ORG_ID = "ca21dea5-8d5c-485a-93ec-1596d9c30ed2";
const API_PUBLIC_KEY =
  "0296d768b0a6e23a20e3ec7de9a5eba9e7559bf4afeeb0e3a33d30cc5764e7233d";
const API_PRIVATE_KEY =
  "2b81c8930041480c71e713314316be870a27e1d0c99ebd1ada2c2c237e06b000";

export async function onPasskeyCreate() {
  if (!isSupported()) {
    alert("Passkeys are not supported on this device");
  }

  try {
    const now = new Date();
    const humanReadableDateTime = `${now.getFullYear()}-${now.getMonth()}-${now.getDay()}@${now.getHours()}h${now.getMinutes()}min`;
    console.log(
      "creating passkey with the following datetime: ",
      humanReadableDateTime
    );

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
        name: `Key @ ${humanReadableDateTime}`,
        displayName: `Key @ ${humanReadableDateTime}`,
      },
      authenticatorSelection: {
        residentKey: "required",
        requireResidentKey: true,
        userVerification: "preferred",
      },
    });
    console.log("passkey registration succeeded: ", authenticatorParams);
    const {
      // data: response,
      client,
      address,
    } = await createSubOrganization(authenticatorParams);
    // console.log("created sub-org", response);
    // const subOrganizationId =
    //   response.activity.result.createSubOrganizationResultV7?.subOrganizationId;
    alert(`Sub-org created! Your address: ${address}`);
    if (!address) {
      throw new Error("No address found");
    }
    // if (!subOrganizationId) {
    //   throw new Error("No sub-organization ID found");
    // }
    const turnkeyAccount = await createTurnkeyAccount(
      client,
      address
      // subOrganizationId
    );
    console.log("created turnkey account", turnkeyAccount.address);
    return turnkeyAccount;
  } catch (e) {
    console.error("error during passkey creation", e);
  }
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
    const getWhoamiResult = await client.getWhoami({
      organizationId: ORG_ID,
    });
    console.log("passkey authentication succeeded: ", getWhoamiResult);
    alert(
      `Successfully logged into sub-organization ${getWhoamiResult.organizationId}`
    );
    // const address = getWhoamiResult.organization.wallets[0].accounts[0].address;
    // const turnkeyAccount = await createTurnkeyAccount(client, address);
    // console.log("created turnkey account", turnkeyAccount.address);
    // return turnkeyAccount;
  } catch (e) {
    console.error("error during passkey signature", e);
  }
}

async function createSubOrganization(
  authenticatorParams: Awaited<ReturnType<typeof createPasskey>>
) {
  const stamper = new ApiKeyStamper({
    apiPublicKey: API_PUBLIC_KEY,
    apiPrivateKey: API_PRIVATE_KEY,
  });
  const client = new TurnkeyClient(
    { baseUrl: "https://api.turnkey.com" },
    stamper
  );

  // const data = await client.createSubOrganization({
  //   type: "ACTIVITY_TYPE_CREATE_SUB_ORGANIZATION_V7",
  //   timestampMs: String(Date.now()),
  //   organizationId: ORG_ID,
  //   parameters: {
  //     subOrganizationName: `Sub-organization at ${String(Date.now())}`,
  //     rootQuorumThreshold: 1,
  //     rootUsers: [
  //       {
  //         userName: "Root User",
  //         apiKeys: [],
  //         authenticators: [authenticatorParams],
  //         oauthProviders: [],
  //       },
  //     ],
  //   },
  // });
  const walletName = uuidv4();
  const wallet = await client.createWallet({
    type: "ACTIVITY_TYPE_CREATE_WALLET",
    timestampMs: String(Date.now()),
    organizationId: ORG_ID,
    parameters: {
      walletName,
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
  console.log(
    "embedded wallet",
    JSON.stringify(wallet.activity.result.createWalletResult, null, 2)
  );
  const address = wallet.activity.result.createWalletResult?.addresses[0];
  if (!address) {
    throw new Error("No address found");
  }
  return {
    // data,
    client,
    address,
  };
}

const createTurnkeyAccount = async (
  turnkeyClient: TurnkeyClient,
  address: string
) => {
  try {
    const account = await createAccountWithAddress({
      client: turnkeyClient,
      organizationId: ORG_ID,
      signWith: address,
      ethereumAddress: address,
    });
    return account;
  } catch (e) {
    console.error("error during turnkey account creation", e);
    throw e;
  }
};
