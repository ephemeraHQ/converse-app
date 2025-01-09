import {
  createPasskey,
  isSupported,
} from "@turnkey/react-native-passkey-stamper";
import { Buffer } from "buffer";
import { RPID } from "./passkeys.constants";
import { TurnkeyStoreInfo } from "./passkeys.interfaces";
import { createTurnkeyAccount } from "./create-turnkey-account";
import { createSubOrganization } from "./create-suborganization";

type PasskeyCreateParams = {
  passkeyName: string;
  setStatusString: (statusString: string) => void;
  setPreviousPasskeyName: (passkeyName: string) => void;
  setTurnkeyInfo: (turnkeyInfo: TurnkeyStoreInfo) => void;
};

export async function onPasskeyCreate({
  passkeyName,
  setStatusString,
  setPreviousPasskeyName,
  setTurnkeyInfo,
}: PasskeyCreateParams) {
  try {
    setStatusString("Creating passkey...");

    const { authenticatorParams } = await createUserPasskey(passkeyName);

    setPreviousPasskeyName(passkeyName);
    setStatusString("Passkey creation successful. Creating sub-org...");

    const { walletId, subOrganizationId, address } =
      await createSubOrganization(authenticatorParams);

    if (!address) {
      throw new Error("No address found");
    }

    setTurnkeyInfo({
      walletId,
      subOrganizationId,
      address,
    });
    setStatusString("Sub-org created! Creating turnkey account...");

    const turnkeyAccount = await createTurnkeyAccount(
      address,
      subOrganizationId!
    );
    setStatusString(`Turnkey account created! Address is ${address}`);
    return turnkeyAccount;
  } catch (e) {
    console.error("error during passkey creation", e);
    throw e;
  }
}

const createUserPasskey = async (passkeyName: string) => {
  if (!isSupported()) {
    alert("Passkeys are not supported on this device");
  }

  const humanReadableDate = new Date().toISOString();
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
      name: passkeyName + " " + humanReadableDate,
      displayName: passkeyName + " " + humanReadableDate,
    },
    authenticatorSelection: {
      residentKey: "required",
      requireResidentKey: true,
      userVerification: "preferred",
    },
  });
  return { authenticatorParams };
};
