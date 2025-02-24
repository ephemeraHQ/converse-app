import { z } from "zod";
import { profileValidationSchema } from "@/features/profiles/schemas/profile-validation.schema";
import { api } from "@/utils/api/api";
import { handleApiError } from "@/utils/api/api.error";
import { buildDeviceMetadata } from "@/utils/device-metadata";

const deviceOSEnum = z.enum(["android", "ios", "web"]);

const createUserRequestSchema = z
  .object({
    privyUserId: z.string(),
    device: z.object({
      os: deviceOSEnum,
      name: z.string().nullable(),
    }),
    identity: z.object({
      privyAddress: z.string(),
      xmtpId: z.string(),
    }),
    profile: profileValidationSchema.pick({
      name: true,
      username: true,
      avatar: true,
    }),
  })
  .strict();

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
      username: z.string(),
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
    username: string;
    avatar?: string;
  };
}): Promise<CreateUserResponse> => {
  const { privyUserId, smartContractWalletAddress, inboxId, profile } = args;

  try {
    const requestPayload = {
      privyUserId,
      device: buildDeviceMetadata(),
      identity: {
        privyAddress: smartContractWalletAddress,
        xmtpId: inboxId,
      },
      profile,
    };

    const validationResult = createUserRequestSchema.safeParse(requestPayload);
    if (!validationResult.success) {
      throw new Error(
        `Invalid request data: ${validationResult.error.message}`,
      );
    }

    const response = await api.post<CreateUserResponse>(
      "/api/v1/users",
      validationResult.data,
    );

    const responseValidation = createUserResponseSchema.safeParse(
      response.data,
    );
    if (!responseValidation.success) {
      throw new Error(
        `Response validation failed: ${responseValidation.error.message}`,
      );
    }

    return responseValidation.data;
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
