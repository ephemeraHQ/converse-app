import { ConsentListEntry } from "@xmtp/react-native-sdk";

import { getChatStore, getSettingsStore } from "../../data/store/accountsStore";
import { deletePeersFromDb, getPeersStatus } from "../../utils/api";
import { getCleanAddress } from "../../utils/eth";
import { getXmtpClient } from "../../utils/xmtpRN/sync";
import { SettingsStoreType } from "../store/settingsStore";

export const setConsent = async (account: string) => {
  console.log(`[Async Updates] Running 001-setConsent for account: ${account}`);

  // Sync peers status from API
  const peersStatusFromAPI = await getPeersStatus(account);
  getSettingsStore(account).getState().setPeersStatus(peersStatusFromAPI);

  const client = await getXmtpClient(account);
  const consentList = await client.contacts.refreshConsentList();
  const peersStatus = getSettingsStore(account).getState().peersStatus;

  // Update Zustand store with peersStatus for auto-consented conversations
  const conversations = getChatStore(account).getState().conversations;
  const peersToConsent: Pick<SettingsStoreType, "peersStatus">["peersStatus"] =
    {};

  for (const conversation of Object.values(conversations)) {
    if (
      conversation.hasOneMessageFromMe &&
      conversation.peerAddress &&
      peersStatus[conversation.peerAddress.toLowerCase()] !== "blocked" &&
      !isPeerInConsentList(conversation.peerAddress, consentList)
    ) {
      peersToConsent[conversation.peerAddress] = "consented";
    }
  }
  if (Object.keys(peersToConsent).length > 0) {
    getSettingsStore(account).getState().setPeersStatus(peersToConsent);
  }

  const updatedPeersStatus = getSettingsStore(account).getState().peersStatus;

  if (Object.keys(updatedPeersStatus).length > 0) {
    const allowedPeers: string[] = [];
    const deniedPeers: string[] = [];

    for (const [peerAddress, status] of Object.entries(updatedPeersStatus)) {
      if (status === "consented") {
        allowedPeers.push(getCleanAddress(peerAddress));
      } else if (status === "blocked") {
        deniedPeers.push(getCleanAddress(peerAddress));
      }
    }

    // Broadcast consent to protocol, then delete it from db
    if (allowedPeers.length > 0) {
      await client.contacts.allow(allowedPeers);
    }
    if (deniedPeers.length > 0) {
      await client.contacts.deny(deniedPeers);
    }
    await deletePeersFromDb(account);
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
