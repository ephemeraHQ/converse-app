import { Platform } from "react-native";
import { api } from "./api";
import * as Device from "expo-device";

export const createUser = async (args: {
  privyUserId: string;
  smartContractWalletAddress: string;
  inboxId: string;
}) => {
  const { privyUserId, smartContractWalletAddress, inboxId } = args;

  await api.post("/api/user/create", {
    privyUserId,
    deviceIdentity: {
      privyAddress: smartContractWalletAddress,
      xmtpId: inboxId,
    },
    device: {
      name: Device.modelId,
      os: Platform.OS.toLowerCase(),
    },
  });
};
