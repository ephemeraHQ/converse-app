import config from "../config";

const thirdwebGateway = `https://${config.thirdwebClientId}.ipfscdn.io`;

export const getIPFSAssetURI = (ipfsURI?: string) => {
  if (!ipfsURI) return ipfsURI;
  if (ipfsURI.startsWith("ipfs://")) {
    return `${thirdwebGateway}/ipfs/${ipfsURI.slice(7)}`;
  } else if (ipfsURI.startsWith("https://ipfs.infura.io/")) {
    // The public infura gateway is now deprecated, using thirdweb's instead
    return ipfsURI.replace("https://ipfs.infura.io/", `${thirdwebGateway}/`);
  }
  return ipfsURI;
};
