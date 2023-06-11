export const getIPFSAssetURI = (ipfsURI?: string) => {
  if (ipfsURI && ipfsURI.startsWith("ipfs://")) {
    return `https://ipfs.thirdwebcdn.com/ipfs/${ipfsURI.slice(7)}`;
  } else if (ipfsURI && ipfsURI.startsWith("https://ipfs.infura.io/")) {
    return ipfsURI.replace(
      "https://ipfs.infura.io/",
      "https://ipfs.thirdwebcdn.com/"
    );
  }
  return ipfsURI;
};
