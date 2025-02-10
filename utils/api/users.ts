import { Platform } from "react-native";
import {
  analyticsAppVersion,
  analyticsBuildNumber,
  analyticsPlatform,
} from "../analytics";
import { api, oldApi } from "./api";
import { getXmtpApiHeaders } from "./auth";
import * as Device from "expo-device";

const lastSaveUser: { [address: string]: number } = {};

export const createUser = async (args: {
  privyUserId: string;
  smartContractWalletAddress: string;
  inboxId: string;
}) => {
  const { privyUserId, smartContractWalletAddress, inboxId } = args;
  const { data } = await api.post("/api/v1/users", {
    privyUserId,
    privyAddress: smartContractWalletAddress,
    inboxId,
    deviceOS: Platform.OS.toLowerCase(),
    deviceName: Device.modelName,
  });
  return data;
};

export const saveUser = async (args: { address: string }) => {
  const { address } = args;
  const now = new Date().getTime();
  const last = lastSaveUser[address] || 0;
  if (now - last < 3000) {
    // Avoid race condition when changing account at same
    // time than coming back on the app.
    return;
  }
  lastSaveUser[address] = now;

  await oldApi.post(
    "/api/user",
    {
      address,
      platform: analyticsPlatform,
      version: analyticsAppVersion,
      build: analyticsBuildNumber,
    },
    { headers: await getXmtpApiHeaders(address) }
  );
};
