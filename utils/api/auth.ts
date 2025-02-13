import { tryGetAppCheckToken } from "../appCheck";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import {
  getSafeCurrentSender,
  useAccountsStore,
} from "@/features/multi-inbox/multi-inbox.store";
import { MultiInboxClientRestorationStates } from "@/features/multi-inbox/multi-inbox-client.types";
import { toHex } from "viem";

export const XMTP_INSTALLATION_ID_HEADER_KEY = "X-XMTP-InstallationId";
export const XMTP_INBOX_ID_HEADER_KEY = "X-XMTP-InboxId";
export const FIREBASE_APP_CHECK_HEADER_KEY = "X-Firebase-AppCheck";
export const XMTP_SIGNATURE_HEADER_KEY = "X-XMTP-Signature";

export type XmtpApiHeaders = {
  [XMTP_INSTALLATION_ID_HEADER_KEY]: string;

  [XMTP_INBOX_ID_HEADER_KEY]: string;

  [FIREBASE_APP_CHECK_HEADER_KEY]: string;

  [XMTP_SIGNATURE_HEADER_KEY]: string;
};

export async function getConvosApiHeaders(): Promise<XmtpApiHeaders> {
  const currentEthereumAddress = getSafeCurrentSender().ethereumAddress;
  const areInboxesRestored =
    useAccountsStore.getState().multiInboxClientRestorationState ===
    MultiInboxClientRestorationStates.idle;
  const appCheckToken = await tryGetAppCheckToken();
  const inboxClient = MultiInboxClient.instance.getInboxClientForAddress({
    ethereumAddress: currentEthereumAddress,
  });

  if (!appCheckToken) {
    throw new Error(
      "No App Check Token Available. This indicates that we believe the app is not running on an authentic build of our application on a device that has not been tampered with."
    );
  }

  if (!areInboxesRestored) {
    throw new Error(
      "[getConvosApiHeaders] Inboxes not restored; cannot create headers"
    );
  }

  if (!inboxClient) {
    throw new Error("[getConvosApiHeaders] No inbox client found for account");
  }

  const rawAppCheckTokenSignature = await inboxClient.signWithInstallationKey(
    appCheckToken
  );
  const appCheckTokenSignatureHexString = toHex(rawAppCheckTokenSignature);

  return {
    [XMTP_INSTALLATION_ID_HEADER_KEY]: inboxClient.installationId,
    [XMTP_INBOX_ID_HEADER_KEY]: inboxClient.inboxId,
    [FIREBASE_APP_CHECK_HEADER_KEY]: appCheckToken,
    [XMTP_SIGNATURE_HEADER_KEY]: appCheckTokenSignatureHexString,
  };
}
