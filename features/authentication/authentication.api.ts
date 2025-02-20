import { api } from "@/utils/api/api";
import { handleApiError } from "@/utils/api/api.error";
import { buildDeviceMetadata } from "@/utils/device-metadata";
import { z } from "zod";

const deviceOSEnum = z.enum(["android", "ios", "web"]);

const createUserResponseSchema = z
  .object({
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
      xmtpId: z.string(),
    }),
    profile: z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().nullable(),
    }),
  })
  .strict();

export type CreateUserResponse = z.infer<typeof createUserResponseSchema>;

export const createUser = async (args: {
  privyUserId: string;
  smartContractWalletAddress: string;
  inboxId: string;
  profile: {
    name: string;
    avatar?: string;
  };
}): Promise<CreateUserResponse> => {
  const { privyUserId, smartContractWalletAddress, inboxId, profile } = args;

  try {
    const response = await api.post<CreateUserResponse>("/api/v1/users", {
      privyUserId,
      device: buildDeviceMetadata(),
      identity: {
        privyAddress: smartContractWalletAddress,
        xmtpId: inboxId,
      },
      profile,
    });

    return createUserResponseSchema.parse(response.data);
  } catch (error) {
    throw handleApiError(error, "createUser");
  }
};

const fetchJwtResponseSchema = z.object({
  token: z.string(),
});

type FetchJwtResponse = z.infer<typeof fetchJwtResponseSchema>;

export async function fetchJwt(): Promise<FetchJwtResponse> {
  try {
    const response = await api.post<FetchJwtResponse>("/api/v1/authenticate");
    return fetchJwtResponseSchema.parse(response.data);
  } catch (error) {
    throw handleApiError(error, "fetchJwt");
  }
}
