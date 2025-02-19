import { buildDeviceMetadata } from "@/utils/device-metadata";
import { api } from "@/utils/api/api";
import { z } from "zod";
import { logger } from "@/utils/logger";

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

  const requestData = {
    privyUserId,
    device: buildDeviceMetadata(),
    identity: {
      privyAddress: smartContractWalletAddress,
      xmtpId: inboxId,
    },
    profile,
  };

  const response = await api.post<CreateUserResponse>(
    "/api/v1/users",
    requestData
  );
  logger.debug(
    `[createUser] Response from /api/v1/users: ${JSON.stringify(
      response.data,
      null,
      2
    )}`
  );
  return createUserResponseSchema.parse(response.data);
};

const fetchJwtResponseSchema = z.object({
  token: z.string(),
});

type FetchJwtResponse = z.infer<typeof fetchJwtResponseSchema>;

export async function fetchJwt() {
  logger.debug(`[fetchJwt] Fetching JWT token`);
  const response = await api.post<FetchJwtResponse>("/api/v1/authenticate");
  logger.debug(
    `[fetchJwt] Response from /api/v1/authenticate: ${JSON.stringify(
      response.data,
      null,
      2
    )}`
  );
  const parsedResponse = fetchJwtResponseSchema.parse(response.data);
  logger.debug(`[fetchJwt] Successfully fetched JWT token`);
  return parsedResponse;
}
