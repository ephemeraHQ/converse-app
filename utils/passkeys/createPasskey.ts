import {
  PasskeyStamper,
  createPasskey,
  isSupported,
} from "@turnkey/react-native-passkey-stamper";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { TurnkeyClient } from "@turnkey/http";
import { Buffer } from "buffer";

const RPID = "dev.converse.xyz";
const ORG_ID = "ca21dea5-8d5c-485a-93ec-1596d9c30ed2";
const API_PUBLIC_KEY =
  "03ac20c5c6e74e5d00ad286ba6d1ed5328ad5220b4ed5de45347868fdaf65c5ea0";
const API_PRIVATE_KEY =
  "d7227a8f664744db8e70b7a0ca19daefc69525c47d296f3816230ad954ed09d5";

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
    const response = await createSubOrganization(authenticatorParams);
    console.log("created sub-org", response);
    alert(
      `Sub-org created! Your ID: ${response.activity.result.createSubOrganizationResultV4?.subOrganizationId}`
    );
  } catch (e) {
    console.error("error during passkey creation", e);
  }
}

async function onPasskeySignature() {
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

  const data = await client.createSubOrganization({
    type: "ACTIVITY_TYPE_CREATE_SUB_ORGANIZATION_V7",
    timestampMs: String(Date.now()),
    organizationId: ORG_ID,
    parameters: {
      subOrganizationName: `Sub-organization at ${String(Date.now())}`,
      rootQuorumThreshold: 1,
      rootUsers: [
        {
          userName: "Root User",
          apiKeys: [],
          authenticators: [authenticatorParams],
          oauthProviders: [],
        },
      ],
    },
  });
  return data;
}
