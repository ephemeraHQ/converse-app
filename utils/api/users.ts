import { apiLogger } from "@/utils/logger";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { z } from "zod";
import { api } from "./api";
import { getXmtpApiHeaders } from "./auth";

const GetCurrentUserResponseSchema = z.object({
  userId: z.string(),
  inboxes: z.array(
    z.object({
      inboxId: z.string(),
      privyEthAddress: z.string(),
    })
  ),
});

export type IGetCurrentUserResponse = z.infer<
  typeof GetCurrentUserResponseSchema
>;

export async function getCurrentUser() {
  const { data } = await api.get(`/users/current`, {
    headers: await getXmtpApiHeaders(),
  });

  const parseResult = GetCurrentUserResponseSchema.safeParse(data);

  if (!parseResult.success) {
    apiLogger.error(
      "[API USERS] getUser parse error:",
      JSON.stringify(parseResult.error)
    );
    throw new Error("Failed to parse user data");
  }

  return parseResult.data;
}

export const createUser = async (args: {
  privyUserId: string;
  smartContractWalletAddress: string;
  inboxId: string;
}) => {
  const { privyUserId, smartContractWalletAddress, inboxId } = args;

  await api.post(
    "/api/users/create",
    {
      inboxId,
      privyUserId,
      deviceIdentity: {
        privyAddress: smartContractWalletAddress,
        xmtpId: inboxId,
      },
      device: {
        name: Device.modelId,
        os: Platform.OS.toLowerCase(),
      },
    },
    { headers: await getXmtpApiHeaders(smartContractWalletAddress) }
  );
};
