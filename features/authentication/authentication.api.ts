import { Platform } from "react-native";
import * as Device from "expo-device";
import { api } from "@/utils/api/api";
import { z } from "zod";

const deviceOSEnum = z.enum(["android", "ios", "web"]);

const createUserResponseSchema = z.object({
  id: z.string(),
  privyUserId: z.string(),
  device: z.object({
    id: z.string(),
    os: deviceOSEnum,
    name: z.string().nullable(),
  }),
  identity: z.object({
    id: z.string(),
    privyAddress: z.string(),
    xmtpId: z.string().nullable(),
  }),
  profile: z
    .object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullable(),
    })
    .nullable(),
});

type CreateUserResponse = z.infer<typeof createUserResponseSchema>;

export const createUser = async (args: {
  privyUserId: string;
  smartContractWalletAddress: string;
  inboxId: string;
}): Promise<CreateUserResponse> => {
  const { privyUserId, smartContractWalletAddress, inboxId } = args;

  const requestData = {
    privyUserId,
    device: {
      os: Platform.OS.toLowerCase(),
      name: Device.modelId,
    },
    identity: {
      privyAddress: smartContractWalletAddress,
      xmtpId: inboxId,
    },
  };

  const response = await api.post<CreateUserResponse>(
    "/api/v1/users",
    requestData
  );
  return createUserResponseSchema.parse(response.data);
};

const fetchJwtResponseSchema = z.object({
  jwt: z.string(),
});

type FetchJwtResponse = z.infer<typeof fetchJwtResponseSchema>;

export async function fetchJwt() {
  // todo(lustig) look at the endpoint this actually is
  const response = await api.post<FetchJwtResponse>("/api/v1/authenticate");
  return fetchJwtResponseSchema.parse(response.data);
}
