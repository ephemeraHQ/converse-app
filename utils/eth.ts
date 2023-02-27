import { ethers } from "ethers";
import { isAddress } from "ethers/lib/utils";

import config from "../config";
import { getLensOwner } from "./lens";

export const ethProvider = new ethers.providers.InfuraProvider(
  config.ethereumNetwork,
  config.infuraApiKey
);

export const getAddressForPeer = async (peer: string) => {
  const is0x = isAddress(peer.toLowerCase());
  const isLens = peer.endsWith(config.lensSuffix);
  const isENS = peer.endsWith(".eth");
  if (!is0x && !isLens && !isENS) {
    throw new Error(`Peer ${peer} is invalid`);
  }
  const resolvedAddress = isLens
    ? await getLensOwner(peer)
    : isENS
    ? await ethProvider.resolveName(peer.toLowerCase())
    : peer;
  return resolvedAddress;
};
