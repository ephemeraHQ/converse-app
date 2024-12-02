import { Platform } from "react-native";
import RNFS from "react-native-fs";
import config from "../../config";

export const getDbDirectory = async () => {
  if (Platform.OS === "ios") {
    const groupPath = await RNFS.pathForGroup(config.appleAppGroup);
    return groupPath;
  } else {
    return `/data/data/${config.bundleId}/databases`;
  }
};
