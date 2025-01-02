import {
  resolveEnsName,
  resolveUnsDomain,
  resolveFarcasterUsername,
} from "@utils/api";
import { getLensOwner } from "@search/utils/lens";
import { isUNSAddress } from "@utils/uns";
import { isAddress } from "ethers/lib/utils";

import config from "../../config";

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
