import RNFS from "react-native-fs";

import config from "../config";

export const uploadFileToWeb3Storage = async (
  filePath: string,
  fileName: string,
  mimeType: string
): Promise<string> => {
  const web3StorageUpload = await RNFS.uploadFiles({
    toUrl: "https://api.web3.storage/upload",
    files: [
      {
        name: "file",
        filename: fileName,
        filepath: filePath,
        filetype: mimeType,
      },
    ],
    headers: {
      Authorization: `Bearer ${config.web3StorageToken}`,
    },
  });
  const uploadResult = await web3StorageUpload.promise;
  const result = JSON.parse(uploadResult.body);
  return result.cid;
};
