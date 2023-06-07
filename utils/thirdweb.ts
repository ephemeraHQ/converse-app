export const getIPFSAssetURI = (ipfsURI?: string) => {
  if (ipfsURI && ipfsURI.startsWith("ipfs://")) {
    return `https://ipfs.thirdwebcdn.com/ipfs/${ipfsURI.slice(7)}`;
  }
  return ipfsURI;
};
