import RNFetchBlob from "rn-fetch-blob";

import config from "../config";

export const uploadFileToWeb3Storage = async (
  filePath: string
): Promise<string> => {
  const result = await RNFetchBlob.fetch(
    "POST",
    "https://api.web3.storage/upload",
    {
      Authorization: `Bearer ${config.web3StorageToken}`,
      "Content-Type": "application/octet-stream",
    },
    RNFetchBlob.wrap(filePath)
  );
  return JSON.parse(result.data).cid;
};
