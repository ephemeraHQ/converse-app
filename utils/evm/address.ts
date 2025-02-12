import {
  resolveEnsName,
  resolveFarcasterUsername,
  resolveUnsDomain,
} from "@/utils/api/profiles";
import { captureError } from "@/utils/capture-error";
import { isUNSAddress } from "@utils/uns";
import axios from "axios";
import { isAddress } from "ethers/lib/utils";
import { config } from "../../config";
import { ethers } from "ethers";
import logger from "@/utils/logger";

export const isSupportedPeer = (peer: string) => {
  const is0x = isAddress(peer.toLowerCase());
  const isUserName = peer.endsWith(config.usernameSuffix);
  const isENS = peer.endsWith(".eth");
  const isLens = peer.endsWith(config.lensSuffix);
  const isFarcaster = peer.endsWith(".fc");
  const isCbId = peer.endsWith(".cb.id");
  const isUNS = isUNSAddress(peer);
  return (
    isUserName ||
    is0x ||
    isLens ||
    isENS ||
    isENS ||
    isFarcaster ||
    isCbId ||
    isUNS
  );
};

export const getAddressForPeer = async (peer: string) => {
  if (!isSupportedPeer(peer)) {
    throw new Error(`Peer ${peer} is invalid`);
  }
  const isLens = peer.endsWith(config.lensSuffix);
  const isUserName = peer.endsWith(config.usernameSuffix);
  const isENS = peer.endsWith(".eth");
  const isFarcaster = peer.endsWith(".fc");
  const isCbId = peer.endsWith(".cb.id");
  const isUNS = isUNSAddress(peer);

  const isENSCompatible = isUserName || isCbId || isENS;

  const resolvedAddress = isENSCompatible
    ? await resolveEnsName(peer)
    : isUNS
    ? await resolveUnsDomain(peer)
    : isFarcaster
    ? await resolveFarcasterUsername(peer.slice(0, peer.length - 3))
    : isLens
    ? await getLensOwner(peer)
    : peer;
  return resolvedAddress || undefined;
};

export function getCleanEthAddress(address: string): string {
  return address.toLowerCase();
}

async function getLensOwner(handle: string) {
  try {
    const { data } = await axios.post(`https://${config.lensApiDomain}/`, {
      operationName: "Profile",
      query:
        "query Profile($handle: Handle) {\n  profile(request: {handle: $handle}) {\n    ownedBy\n  }\n}\n",
      variables: {
        handle,
      },
    });
    return data.data?.profile?.ownedBy || null;
  } catch (e) {
    captureError(e);
  }
  return null;
}
