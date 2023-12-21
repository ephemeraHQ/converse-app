import { Signer } from "ethers";
import { Platform } from "react-native";

export const getEthOSSigner = (): Signer | undefined => {
  if (Platform.OS !== "android") return undefined;
  const ethOSSDK = require("walletsdk-ethos");
  return {
    getAddress: async () => {
      const address = await ethOSSDK.getAddress();
      return address as string;
    },
    signMessage: async (message: ArrayLike<number> | string) => {
      if (typeof message === "string") {
        const signed = await ethOSSDK.signMessage({ message });
        return signed;
      } else {
        const signed = await ethOSSDK.signMessage({
          message: message.toString(),
        });
        return signed;
      }
    },
  } as Signer;
};

export const isEthOS = () => {
  if (Platform.OS !== "android") return false;
  const ethOSSDK = require("walletsdk-ethos");
  return ethOSSDK.isEthOS();
};
