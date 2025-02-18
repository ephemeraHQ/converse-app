import { buildDeviceMetadata } from "@/utils/device-metadata";
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
    xmtpId: z.string(),
  }),
  profile: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
  }),
});

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
  return createUserResponseSchema.parse(response.data);
};

const fetchJwtResponseSchema = z.object({
  jwt: z.string(),
});

type FetchJwtResponse = z.infer<typeof fetchJwtResponseSchema>;

export async function fetchJwt() {
  // todo(lustig) look at the endpoint this actually is
  // const response = await api.post<FetchJwtResponse>("/api/v1/authenticate");
  // return fetchJwtResponseSchema.parse(response.data);
  // https://xmtp-labs.slack.com/archives/C07NSHXK693/p1739877738959529
  const dummyJwtUntilJwtBackendWorks = "dummyJwtUntilJwtBackendWorks";
  return dummyJwtUntilJwtBackendWorks;
}
