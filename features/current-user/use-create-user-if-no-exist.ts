import { usePrivy } from "@privy-io/expo"
import { AxiosError } from "axios"
import { useEffect, useRef } from "react"
import { formatRandomUsername } from "@/features/auth-onboarding/utils/format-random-user-name"
import { useAuthenticationStore } from "@/features/authentication/authentication.store"
import { IPrivyUserId } from "@/features/authentication/authentication.types"
import {
  getMultiInboxStoreSenders,
  getSafeCurrentSender,
} from "@/features/authentication/multi-inbox.store"
import {
  createUserMutation,
  ICreateUserMutationArgs,
} from "@/features/current-user/create-user.mutation"
import { IConvosCurrentUserId } from "@/features/current-user/current-user.types"
import { getStoredDeviceId, storeDeviceId } from "@/features/devices/device.storage"
import { createDevice, fetchDevice, IDeviceCreateInput } from "@/features/devices/devices.api"
import { IDevice } from "@/features/devices/devices.types"
import { getDeviceModelId, getDeviceOs } from "@/features/devices/devices.utils"
import { setUserDeviceQueryData } from "@/features/devices/user-device.query"
import { createIdentity, fetchDeviceIdentities } from "@/features/identities/identities.api"
import {
  getDevicePushNotificationsToken,
  getExpoPushNotificationsToken,
} from "@/features/notifications/notifications.service"
import { useSmartWalletClient } from "@/features/wallets/smart-wallet"
import { captureError } from "@/utils/capture-error"
import { AuthenticationError } from "@/utils/error"
import { IEthereumAddress } from "@/utils/evm/address"
import { authLogger } from "@/utils/logger"
import { tryCatch } from "@/utils/try-catch"
import { fetchCurrentUser } from "./current-user.api"
import { invalidateCurrentUserQuery } from "./current-user.query"

/**
 * Handles the device registration and identity creation/linking flow
 */
async function makeSureDeviceAndIdentitiesAreCreated(args: {
  userId: IConvosCurrentUserId
  // privyAddress: IEthereumAddress
  // xmtpId: IXmtpInboxId
}) {
  const { userId } = args

  // 1. Check for existing deviceId in SecureStore
  let deviceId = await getStoredDeviceId()
  let device: IDevice | null = null

  if (deviceId) {
    // Try to fetch the device to validate it still exists
    try {
      device = await fetchDevice({ userId, deviceId })
      authLogger.debug("Found existing device", { deviceId })
    } catch (error) {
      captureError(new AuthenticationError({ error, additionalMessage: "Stored device not found" }))
      deviceId = null
    }
  }

  // 2. If no valid deviceId, create new device
  if (!deviceId) {
    const [{ data: expoToken }, { data: pushToken }] = await Promise.all([
      tryCatch(getExpoPushNotificationsToken()),
      tryCatch(getDevicePushNotificationsToken()),
    ])

    const deviceInput: IDeviceCreateInput = {
      os: getDeviceOs(),
      name: getDeviceModelId(),
      expoToken,
      pushToken,
    }

    try {
      authLogger.debug("Creating new device...")
      device = await createDevice({
        userId,
        device: deviceInput,
      })
      authLogger.debug("Created new device")
      setUserDeviceQueryData({ userId, device })
      await storeDeviceId(device.id)
      deviceId = device.id
    } catch (error) {
      throw new AuthenticationError({ error, additionalMessage: "Failed to create device" })
    }
  }

  // 3. Fetch existing identities for this device
  const { data: identities, error: fetchDeviceIdentitiesError } = await tryCatch(
    fetchDeviceIdentities({ deviceId }),
  )

  if (fetchDeviceIdentitiesError) {
    throw new AuthenticationError({
      error: fetchDeviceIdentitiesError,
      additionalMessage: "Failed to fetch device identities",
    })
  }

  const senders = getMultiInboxStoreSenders()

  const missingIdentities = senders.filter(
    (sender) => !identities.some((identity) => identity.xmtpId === sender.inboxId),
  )

  authLogger.debug(`Creating ${missingIdentities.length} missing device identities`)

  for (const sender of missingIdentities) {
    // 4. If no identities, create one
    await createIdentity({
      deviceId,
      input: {
        privyAddress: sender.ethereumAddress, // What if it's not a privy address and we connected via EOA?
        xmtpId: sender.inboxId,
      },
    })
    authLogger.debug(`Created new identity for sender ${sender.inboxId} for device`)
  }

  // 5. Refresh current user data to include new device/identity
  await invalidateCurrentUserQuery()
}

async function startFlow(args: {
  privyUserId: IPrivyUserId
  smartWalletClientAddress: IEthereumAddress
}) {
  const { privyUserId, smartWalletClientAddress } = args

  const { data: currentUser, error: fetchCurrentUserError } = await tryCatch(fetchCurrentUser())

  // User exists, ensure device setup
  if (currentUser) {
    authLogger.debug("User exists, ensuring device and identities are created")
    return makeSureDeviceAndIdentitiesAreCreated({
      userId: currentUser.id,
    })
  }

  // User doesn't exist, create new user
  if (
    (fetchCurrentUserError &&
      fetchCurrentUserError instanceof AxiosError &&
      fetchCurrentUserError?.response?.status === 404) ||
    !currentUser
  ) {
    authLogger.debug("User doesn't exist in the backend, creating new user...")

    const currentSender = getSafeCurrentSender()
    const createdUser = await createUserMutation({
      inboxId: currentSender.inboxId,
      privyUserId,
      smartContractWalletAddress: smartWalletClientAddress,
      profile: getRandomProfile(),
    })

    authLogger.debug("User/Profile created in backend")

    await makeSureDeviceAndIdentitiesAreCreated({
      userId: createdUser.id,
    })
    return
  }

  throw new AuthenticationError({
    error: fetchCurrentUserError,
    additionalMessage: "Failed to fetch current user",
  })
}

/**
 * Ensures user profile exists in backend after Privy signup, creating it if missing
 * This handles edge cases like app closure during onboarding
 */
export function useCreateUserIfNoExist() {
  const { user: privyUser } = usePrivy()
  const { smartWalletClient } = useSmartWalletClient()

  const isSubscribedRef = useRef(false)

  useEffect(() => {
    if (!privyUser) {
      //   authLogger.debug("Privy user not found, skipping user creation")
      return
    }

    if (!smartWalletClient) {
      //   authLogger.debug("Smart contract client not found, skipping user creation")
      return
    }

    if (isSubscribedRef.current) {
      //   authLogger.debug("Already subscribed to authentication store, skipping user creation")
      return
    }

    isSubscribedRef.current = true

    const unsubscribe = useAuthenticationStore.subscribe(
      (state) => state.status,
      (status) => {
        if (status !== "signedIn") {
          return
        }

        if (!smartWalletClient) {
          throw new AuthenticationError({
            error: new Error("Smart contract client not found"),
          })
        }

        startFlow({
          privyUserId: privyUser.id as IPrivyUserId,
          smartWalletClientAddress: smartWalletClient.account.address as IEthereumAddress,
        }).catch(captureError)
      },
      {
        fireImmediately: true,
      },
    )

    return () => {
      unsubscribe()
    }
  }, [privyUser, smartWalletClient])
}

const firstNames = [
  "Alice",
  "Bob",
  "Charlie",
  "David",
  "Emma",
  "Frank",
  "Grace",
  "Henry",
  "Ivy",
  "Jack",
]
const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
]

function getRandomProfile(): ICreateUserMutationArgs["profile"] {
  const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  const name = `${randomFirstName} ${randomLastName}`
  const username = formatRandomUsername({ displayName: name })

  return {
    name,
    username,
    avatar: null,
    description: null,
  }
}
