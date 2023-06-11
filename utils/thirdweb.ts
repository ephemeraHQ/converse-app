export const getIPFSAssetURI = (ipfsURI?: string) => {
  if (!ipfsURI) return ipfsURI;
  if (ipfsURI.startsWith("ipfs://")) {
    return `https://ipfs.thirdwebcdn.com/ipfs/${ipfsURI.slice(7)}`;
  } else if (ipfsURI.startsWith("https://ipfs.infura.io/")) {
    // The public infura gateway is now deprecated, using thirdweb's instead
    return ipfsURI.replace(
      "https://ipfs.infura.io/",
      "https://ipfs.thirdwebcdn.com/"
    );
  }
  return ipfsURI;
};
