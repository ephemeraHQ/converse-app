import { apiLogger } from "@/utils/logger";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { z } from "zod";
import { api } from "./api";
import { getXmtpApiHeaders } from "./auth";

const GetUserByPrivyUserIdResponseSchema = z.object({
  userId: z.string(),
  inboxes: z.array(
    z.object({
      inboxId: z.string(),
      privyEthAddress: z.string(),
    })
  ),
});

export type IGetUserByPrivyUserIdResponse = z.infer<
  typeof GetUserByPrivyUserIdResponseSchema
>;

export async function getUserByPrivyUserId(args: { privyId: string }) {
  apiLogger.debug(`[API USERS] getUser for privyId: ${args.privyId}`);
  const { privyId } = args;

  if (!privyId) {
    throw new Error("PrivyId is required");
  }

  const { data } = await api.get(`/api/users/privy/${privyId}`, {
    headers: await getXmtpApiHeaders(privyId),
  });

  const parseResult = GetUserByPrivyUserIdResponseSchema.safeParse(data);
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
