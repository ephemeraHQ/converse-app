import path from "path";
import { Client } from "@xmtp/react-native-sdk";
import * as RNFS from "react-native-fs";

export const getXmtpNativeLogFile = async () => {
  const nativeLogs = (await Client.exportNativeLogs()) as string;
  const nativeLogFilePath = path.join(
    RNFS.TemporaryDirectoryPath,
    "libxmtp.logs.txt",
  );
  await RNFS.writeFile(nativeLogFilePath, nativeLogs, "utf8");
  return nativeLogFilePath;
};
