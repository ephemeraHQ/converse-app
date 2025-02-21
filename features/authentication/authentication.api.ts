import { api } from "@/utils/api/api";
import { handleApiError } from "@/utils/api/api.error";
import { buildDeviceMetadata } from "@/utils/device-metadata";
import { z } from "zod";
import { logger } from "@/utils/logger";

const deviceOSEnum = z.enum(["android", "ios", "web"]);

// Request validation schema
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
    profile: z.object({
      name: z.string(),
      username: z
        .string()
        .min(3, "Username must be at least 3 characters long")
        .max(30, "Username cannot exceed 30 characters")
        .regex(
          /^[a-zA-Z0-9]+$/,
          "Username can only contain letters and numbers"
        ),
      avatar: z.string().optional(),
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
    // Build the request payload
    const requestPayload = {
      privyUserId,
      device: buildDeviceMetadata(),
      identity: {
        privyAddress: smartContractWalletAddress,
        xmtpId: inboxId,
      },
      profile,
    };

    // Validate request payload
    const validationResult = createUserRequestSchema.safeParse(requestPayload);
    if (!validationResult.success) {
      logger.error(
        `[createUser] Request validation failed:
        ${JSON.stringify(validationResult.error.errors, null, 2)}
        Payload: ${JSON.stringify(requestPayload, null, 2)}`
      );
      throw new Error("Invalid request data");
    }

    // Make the API call with validated data
    const response = await api.post<CreateUserResponse>(
      "/api/v1/users",
      validationResult.data
    );

    // Validate response
    const responseValidation = createUserResponseSchema.safeParse(
      response.data
    );
    if (!responseValidation.success) {
      logger.error(
        `[createUser] Response validation failed:
        ${JSON.stringify(responseValidation.error.errors, null, 2)}
        Response: ${JSON.stringify(response.data, null, 2)}`
      );
      throw new Error("Invalid response data from server");
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
