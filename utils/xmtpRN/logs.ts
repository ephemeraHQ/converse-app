import { Client } from "@xmtp/react-native-sdk";
import path from "path";
import * as RNFS from "react-native-fs";

export const getNativeLogFile = async () => {
  const nativeLogs = (await Client.exportNativeLogs()) as string;
  const nativeLogFilePath = path.join(
    RNFS.TemporaryDirectoryPath,
    "libxmtp.logs.txt"
  );
  await RNFS.writeFile(nativeLogFilePath, nativeLogs, "utf8");
  return nativeLogFilePath;
};
