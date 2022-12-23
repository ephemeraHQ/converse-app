import { Network, Alchemy } from "alchemy-sdk";

import config from "../config";

const polygonSettings = {
  apiKey: config.alchemyPolygon,
  network: Network.MATIC_MAINNET,
};

const alchemyPolygon = new Alchemy(polygonSettings);

const LENS_PROTOCOL_PROFILES_ADDRESS =
  "0xdb46d1dc155634fbc732f92e853b10b288ad5a1d";

export const getLensProfiles = async (address: string) => {
  const lensNFTs = await alchemyPolygon.nft.getNftsForOwner(address, {
    contractAddresses: [LENS_PROTOCOL_PROFILES_ADDRESS],
  });
  return lensNFTs.ownedNfts;
};

export const getLensHandle = async (
  address: string
): Promise<string | undefined> => {
  const lensProfiles = await getLensProfiles(address);
  const lensHandle = lensProfiles[0]?.title;
  if (lensHandle) {
    if (lensHandle.startsWith("@")) {
      return lensHandle.slice(1);
    }
    return lensHandle;
  }
  return undefined;
};
