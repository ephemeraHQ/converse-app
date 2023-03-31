import { Client } from "@xmtp/xmtp-js";
import { useContext, useEffect } from "react";

import { AppContext } from "../data/store/context";
import { XmtpDispatchTypes } from "../data/store/xmtpReducer";
import { getBlockedPeers } from "../utils/api";
import { loadXmtpKeys } from "../utils/keychain";
import { getXmtpClientFromKeys, getXmtpSignature } from "../utils/xmtp";

let xmtpClient: Client | null;
let xmtpApiSignature: string | null;

export const getLocalXmtpClient = async () => {
  if (xmtpClient) return xmtpClient;
  const keys = await loadXmtpKeys();
  if (keys) {
    const parsedKeys = JSON.parse(keys);
    xmtpClient = await getXmtpClientFromKeys(parsedKeys);
    getXmtpApiHeaders();
  }
  return xmtpClient;
};

export const getXmtpApiHeaders = async () => {
  const client = await getLocalXmtpClient();
  if (!client) throw new Error("No XMTP client to generate API signature");
  if (xmtpApiSignature && client)
    return {
      "xmtp-api-signature": xmtpApiSignature,
      "xmtp-api-address": client.address,
    };
  xmtpApiSignature = await getXmtpSignature(client, "XMTP_IDENTITY");
  return {
    "xmtp-api-signature": xmtpApiSignature,
    "xmtp-api-address": client.address,
  };
};

export const resetLocalXmtpClient = () => {
  xmtpClient = null;
  xmtpApiSignature = null;
};

export default function XmtpState() {
  const { dispatch, state } = useContext(AppContext);
  // On open; opening XMTP session
  useEffect(() => {
    getLocalXmtpClient();
  }, []);
  useEffect(() => {
    if (state.xmtp.connected) {
      getBlockedPeers()
        .then((addresses) => {
          const blockedPeerAddresses: { [peerAddress: string]: boolean } = {};
          addresses.forEach((peerAddress) => {
            blockedPeerAddresses[peerAddress.toLowerCase()] = true;
          });
          dispatch({
            type: XmtpDispatchTypes.XmtpSetBlockedPeerAddresses,
            payload: { blockedPeerAddresses },
          });
        })
        .catch((e) => {
          console.log("Error while getting blocked peers", e);
        });
    }
  }, [dispatch, state.xmtp.connected]);
  return null;
}
