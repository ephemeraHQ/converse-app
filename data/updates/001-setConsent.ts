import { ConsentListEntry } from "@xmtp/react-native-sdk";

import { getChatStore, getSettingsStore } from "../../data/store/accountsStore";
import { deletePeersFromDb, getPeersStatus } from "../../utils/api";
import { getXmtpClient } from "../../utils/xmtpRN/client";
import { consentToPeersOnProtocol } from "../../utils/xmtpRN/conversations";
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
      peersStatus[conversation.peerAddress] !== "blocked" &&
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
        allowedPeers.push(peerAddress);
      } else if (status === "blocked") {
        deniedPeers.push(peerAddress);
      }
    }

    // Broadcast consent to protocol, then delete it from db
    try {
      if (allowedPeers.length > 0) {
        await consentToPeersOnProtocol(account, allowedPeers, "allow");
        deletePeersFromDb(account, allowedPeers);
      }
      if (deniedPeers.length > 0) {
        await consentToPeersOnProtocol(account, deniedPeers, "deny");
        deletePeersFromDb(account, deniedPeers);
      }
    } catch (error) {
      console.error("Error updating consent: ", error);
    }
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
