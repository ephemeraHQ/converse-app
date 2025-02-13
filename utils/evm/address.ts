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
  // new backend is going to do all of this for us
  return false;
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
  // new backend is going to do all of this for us
  return undefined;
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

/**
 * Resolves a Coinbase ID to an Ethereum address using ENS resolution
 * @param cbId The Coinbase ID to resolve (e.g. "username.cb.id")
 * @returns The resolved Ethereum address or null if resolution fails
 */
export async function resolveCoinbaseId(cbId: string): Promise<string | null> {
  try {
    if (!cbId.endsWith(".cb.id")) {
      throw new Error("Invalid Coinbase ID format. Must end with .cb.id");
    }

    const provider = new ethers.providers.StaticJsonRpcProvider({
      url: config.evm.rpcEndpoint,
      skipFetchSetup: true,
    });

    const address = await provider.resolveName(cbId);
    return address;
  } catch (error) {
    logger.error(`Failed to resolve Coinbase ID ${cbId}:`, error);
    return null;
  }
}
