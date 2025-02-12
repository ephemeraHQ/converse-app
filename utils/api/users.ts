import { apiLogger } from "@/utils/logger";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { z } from "zod";
import { api, oldApi } from "./api";
import { getXmtpApiHeaders } from "./auth";

const ProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const DeviceSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  os: z.enum(["ios", "android", "web"]),
  pushToken: z.string().nullable(),
  expoToken: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const DeviceIdentitySchema = z.object({
  id: z.string(),
  xmtpId: z.string().nullable(),
  privyAddress: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  profile: ProfileSchema.nullable(),
});

const UserSchema = z.object({
  id: z.string(),
  privyUserId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  devices: z.array(DeviceSchema),
  deviceIdentities: z.array(DeviceIdentitySchema),
});

export type IUser = z.infer<typeof UserSchema>;
export type IDeviceIdentity = z.infer<typeof DeviceIdentitySchema>;
export type IDevice = z.infer<typeof DeviceSchema>;
export type IProfile = z.infer<typeof ProfileSchema>;

export async function getUser(args: { privyId: string }) {
  apiLogger.debug(`[API USERS] getUser for privyId: ${args.privyId}`);
  const { privyId } = args;

  if (!privyId) {
    throw new Error("PrivyId is required");
  }

  const { data } = await oldApi.get(`/api/users/${privyId}`, {
    headers: await getXmtpApiHeaders(privyId),
  });

  const parseResult = UserSchema.safeParse(data);
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
    "/api/user/create",
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
