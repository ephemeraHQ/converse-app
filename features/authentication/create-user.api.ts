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
      avatar: z.string().nullable(),
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

    // Ensure avatar is null if it doesn't exist
    if (response.data?.profile && response.data.profile.avatar === undefined) {
      response.data.profile.avatar = null;
    }
    
    return response.data;
  } catch (error) {
    throw handleApiError(error, "createUser");
  }
};
