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
  
type CreateUserResponse = {
  id: string;
  privyUserId: string;
  device: {
    id: string;
    os: "android" | "ios" | "web";
    name: string | null;
  };
  identity: {
    id: string;
    privyAddress: string;
    xmtpId: string;
  };
  profile: {
    id: string;
    name: string;
    username: string;
    description: string | null;
    avatar: string | null;
  };
};

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
