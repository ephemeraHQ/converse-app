import { z } from "zod"
import { captureError } from "@/utils/capture-error"
import { convosApi } from "@/utils/convos-api/convos-api-instance"

// Schemas for response validation
const RegisterInstallationResponseSchema = z.object({
  installationId: z.string(),
  validUntil: z.number(),
})

// Schema for registration request
const DeliveryMechanismTypeSchema = z.enum([
  "apnsDeviceToken",
  "firebaseDeviceToken",
  "customToken",
])

const DeliveryMechanismSchema = z.object({
  deliveryMechanismType: z.object({
    case: DeliveryMechanismTypeSchema,
    value: z.string(),
  }),
})

const RegistrationSchema = z.object({
  installationId: z.string(),
  deliveryMechanism: DeliveryMechanismSchema,
})

// Type definitions
export type IDeliveryMechanismType = z.infer<typeof DeliveryMechanismTypeSchema>

export type IDeliveryMechanism = z.infer<typeof DeliveryMechanismSchema>

export type IRegistrationRequest = z.infer<typeof RegistrationSchema>

export type IRegisterInstallationResponse = z.infer<typeof RegisterInstallationResponseSchema>

// Schema for subscription without metadata
const SubscribeRequestSchema = z.object({
  installationId: z.string(),
  topics: z.array(z.string()),
})

export type ISubscribeRequest = z.infer<typeof SubscribeRequestSchema>

// Schema for HMAC key
const HmacKeySchema = z.object({
  thirtyDayPeriodsSinceEpoch: z.number(),
  key: z.string(),
})

// Schema for subscription with metadata
const SubscriptionSchema = z.object({
  topic: z.string(),
  isSilent: z.boolean().optional().default(false),
  hmacKeys: z.array(HmacKeySchema),
})

const SubscribeWithMetadataRequestSchema = z.object({
  installationId: z.string(),
  subscriptions: z.array(SubscriptionSchema),
})

export type IHmacKey = z.infer<typeof HmacKeySchema>
export type ISubscription = z.infer<typeof SubscriptionSchema>
export type ISubscribeWithMetadataRequest = z.infer<typeof SubscribeWithMetadataRequestSchema>

// Schema for unsubscribe request
const UnsubscribeRequestSchema = z.object({
  installationId: z.string(),
  topics: z.array(z.string()),
})

export type IUnsubscribeRequest = z.infer<typeof UnsubscribeRequestSchema>

/**
 * Registers a device installation for push notifications
 */
export const registerNotificationInstallation = async (args: IRegistrationRequest) => {
  try {
    const { data } = await convosApi.post<IRegisterInstallationResponse>(
      "/api/v1/notifications/register",
      args,
    )

    const result = RegisterInstallationResponseSchema.safeParse(data)
    if (!result.success) {
      captureError(result.error)
    }

    return data
  } catch (error) {
    throw error
  }
}

/**
 * Subscribes an installation to notification topics with metadata
 */
export const subscribeToNotificationTopicsWithMetadata = async (
  args: ISubscribeWithMetadataRequest,
) => {
  try {
    await convosApi.post("/api/v1/notifications/subscribe", args)
  } catch (error) {
    throw error
  }
}

/**
 * Unsubscribes an installation from notification topics
 */
export const unsubscribeFromNotificationTopics = async (args: IUnsubscribeRequest) => {
  try {
    await convosApi.post("/api/v1/notifications/unsubscribe", args)
  } catch (error) {
    throw error
  }
}

/**
 * Unregisters a device installation
 */
export const unregisterNotificationInstallation = async (args: { installationId: string }) => {
  const { installationId } = args

  try {
    await convosApi.delete(`/api/v1/notifications/unregister/${installationId}`)
  } catch (error) {
    throw error
  }
}
