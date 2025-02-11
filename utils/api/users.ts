import { Platform } from "react-native";
import { api } from "./api";
import { getXmtpApiHeaders } from "./auth";
import * as Device from "expo-device";

export const createUser = async (args: {
  privyUserId: string;
  smartContractWalletAddress: string;
  inboxId: string;
}) => {
  const { privyUserId, smartContractWalletAddress, inboxId } = args;

  await api.post(
    "/api/user/create",
    {
      inboxId,
      address: smartContractWalletAddress,
      privyId: privyUserId,
      deviceName:
        /* todo get we get the ios entgitlement to get "vivians iphone"*/ Device.modelId,
      os: Platform.OS.toLowerCase(),
    },
    { headers: await getXmtpApiHeaders(smartContractWalletAddress) }
  );
};
