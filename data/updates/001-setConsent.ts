import { ConsentListEntry } from "@xmtp/react-native-sdk";

import { getChatStore, getSettingsStore } from "../../data/store/accountsStore";
import { getXmtpClient } from "../../utils/xmtpRN/client";
import { SettingsStoreType } from "../store/settingsStore";

export const setConsent = async (account: string) => {
  console.log(`[Async Updates] Running 001-setConsent for account: ${account}`);

  const client = await getXmtpClient(account);
  const consentList = await client.contacts.refreshConsentList();

  // Update Zustand store with peersStatus for auto-consented conversations
  const conversations = getChatStore(account).getState().conversations;
  const peersToConsent: Pick<SettingsStoreType, "peersStatus">["peersStatus"] =
    {};

  for (const conversation of Object.values(conversations)) {
    if (
      conversation.hasOneMessageFromMe &&
      !isPeerInConsentList(conversation.peerAddress, consentList)
    ) {
      peersToConsent[conversation.peerAddress] = "consented";
    }
  }
  if (Object.keys(peersToConsent).length > 0) {
    getSettingsStore(account).getState().setPeersStatus(peersToConsent);
  }

  const peersStatus = getSettingsStore(account).getState().peersStatus;

  if (Object.keys(peersStatus).length > 0) {
    const allowedPeers: string[] = [];
    const deniedPeers: string[] = [];

    for (const [peerAddress, status] of Object.entries(peersStatus)) {
      if (status === "consented") {
        allowedPeers.push(peerAddress);
      } else if (status === "blocked") {
        deniedPeers.push(peerAddress);
      }
    }

    // Broadcast consent to protocol
    allowedPeers.length > 0 && client.contacts.allow(allowedPeers);
    deniedPeers.length > 0 && client.contacts.deny(deniedPeers);

    // @todo: await for the return,
    // and remove the associated peers from the UserStatus table
  }
};

function isPeerInConsentList(
  peerAddress: string,
  consentList: ConsentListEntry[]
): boolean {
  return consentList.some(
    (entry) => entry.entryType === "address" && entry.value === peerAddress
  );
}
