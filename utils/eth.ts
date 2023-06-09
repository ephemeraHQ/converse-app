import { pbkdf2 } from "crypto";
import { ethers } from "ethers";
import {
  entropyToMnemonic,
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

export const getAddressForPeer = async (peer: string) => {
  const is0x = isAddress(peer.toLowerCase());
  const isLens = peer.endsWith(config.lensSuffix);
  const isENS = peer.endsWith(".eth");
  const isFarcaster = peer.endsWith(".fc");
  const isUNS = isUNSAddress(peer);
  if (!is0x && !isLens && !isENS && !isFarcaster && !isUNS) {
    throw new Error(`Peer ${peer} is invalid`);
  }
  const resolvedAddress = isLens
    ? await getLensOwner(peer)
    : isENS
    ? await resolveEnsName(peer)
    : isFarcaster
    ? await resolveFarcasterUsername(peer.slice(0, peer.length - 3))
    : isUNS
    ? await resolveUnsDomain(peer)
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
