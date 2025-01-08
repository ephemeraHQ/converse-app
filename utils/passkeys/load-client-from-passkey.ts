import { Passkey } from "react-native-passkey";
import { RPID } from "./passkeys.constants";
import { loadPasskeyInfo } from "./persist-passkeys";
import { createTurnkeyAccount } from "./create-turnkey-account";
import { TurnkeyStoreInfo } from "./passkeys.interfaces";

type LoadAccountFromPasskeyParams = {
  setStatusString: (statusString: string) => void;
  setPreviousPasskeyName: (passkeyName: string) => void;
  setTurnkeyInfo: (turnkeyInfo: TurnkeyStoreInfo) => void;
};

export const loadAccountFromPasskey = async ({
  setStatusString,
  setPreviousPasskeyName,
  setTurnkeyInfo,
}: LoadAccountFromPasskeyParams) => {
  try {
    setStatusString("Loading passkey...");

    const passkey = await Passkey.get({
      rpId: RPID,
      challenge: "TODO",
      userVerification: "preferred",
    });

    const passkeyInfo = loadPasskeyInfo(passkey.response.userHandle);
    if (!passkeyInfo) {
      throw new Error("No passkey info found");
    }
    setStatusString("Creating account...");
    setPreviousPasskeyName(passkeyInfo.passkeyName);
    setTurnkeyInfo({
      subOrganizationId: passkeyInfo.subOrganizationId,
      walletId: passkeyInfo.walletId,
      address: passkeyInfo.address,
    });
    const account = await createTurnkeyAccount(
      passkeyInfo.address,
      passkeyInfo.subOrganizationId
    );
    setStatusString("Account created");
    return { account, turnkeyInfo: passkeyInfo };
  } catch (e) {
    console.error("error during passkey load", e);
    throw e;
  }
};
