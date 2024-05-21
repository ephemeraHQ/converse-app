import { pbkdf2 } from "crypto";
import { ethers } from "ethers";
import {
  entropyToMnemonic,
  getAddress,
  isAddress,
  mnemonicToEntropy,
} from "ethers/lib/utils";

import config from "../config";
import {
  resolveEnsName,
  resolveFarcasterUsername,
  resolveUnsDomain,
} from "./api";
import { getLensOwner } from "./lens";
import { isUNSAddress } from "./uns";

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
  return resolvedAddress;
};

export const validateMnemonic = (mnemonic: string) =>
  entropyToMnemonic(mnemonicToEntropy(mnemonic));

export const getPrivateKeyFromMnemonic = (mnemonic: string): Promise<string> =>
  new Promise((resolve, reject) => {
    pbkdf2(mnemonic, "mnemonic", 2048, 64, "sha512", (error, key) => {
      if (error) return reject(error);
      const hdnode = ethers.utils.HDNode.fromSeed(key);
      const path = "m/44'/60'/0'/0/0";
      const childNode = hdnode.derivePath(path);
      const privateKey = childNode.privateKey;
      resolve(privateKey);
    });
  });

export const getCleanAddress = (address: string) =>
  getAddress(address.toLowerCase());
