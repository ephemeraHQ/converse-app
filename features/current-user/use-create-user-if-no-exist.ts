import { usePrivy } from "@privy-io/expo"
import { AxiosError } from "axios"
import { useEffect, useRef } from "react"
import { formatRandomUsername } from "@/features/auth-onboarding/utils/format-random-user-name"
import { useAuthenticationStore } from "@/features/authentication/authentication.store"
import { IPrivyUserId } from "@/features/authentication/authentication.types"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  ICreateUserMutationArgs,
  useCreateUserMutation,
} from "@/features/current-user/create-user.mutation"
import { useSmartWalletClient } from "@/features/wallets/smart-wallet"
import { captureError } from "@/utils/capture-error"
import { IEthereumAddress } from "@/utils/evm/address"
import logger from "@/utils/logger"
import { fetchCurrentUser } from "./current-user.api"

/**
 * Ensures user profile exists in backend after Privy signup, creating it if missing
 * This handles edge cases like app closure during onboarding
 */
export function useCreateUserIfNoExist() {
  const { mutateAsync: createUserAsync } = useCreateUserMutation()

  const { user: privyUser } = usePrivy()
  const { smartWalletClient } = useSmartWalletClient()

  const isSubscribedRef = useRef(false)

  useEffect(() => {
    if (!privyUser) {
      //   logger.debug("Privy user not found, skipping user creation")
      return
    }

    if (!smartWalletClient) {
      //   logger.debug("Smart contract client not found, skipping user creation")
      return
    }

    if (isSubscribedRef.current) {
      //   logger.debug("Already subscribed to authentication store, skipping user creation")
      return
    }

    isSubscribedRef.current = true

    const unsubscribe = useAuthenticationStore.subscribe(
      (state) => state.status,
      (status) => {
        if (status !== "signedIn") {
          return
        }

        // Make sure we have current user created but not needed to show the app
        fetchCurrentUser()
          .then((currentUser) => {
            if (currentUser) {
              //   logger.debug("User already exists in the backend, skipping user creation")
            } else {
              captureError(new Error(`Shouldn't be here because no user should throw a 404`))
            }
          })
          .catch(async (error) => {
            const currentUser = getSafeCurrentSender()

            if (error instanceof AxiosError && error.response && error.response.status === 404) {
              logger.debug("User doesn't exist in the backend, let's create it!")

              if (!privyUser) {
                throw new Error(
                  "Privy user not found while creating user because it doesn't exist in the backend",
                )
              }

              if (!smartWalletClient) {
                throw new Error(
                  "Smart contract wallet address not found while creating user because it doesn't exist in the backend",
                )
              }

              // User doesn't exist in the backend, let's create it!
              await createUserAsync({
                inboxId: currentUser.inboxId,
                privyUserId: privyUser.id as IPrivyUserId,
                smartContractWalletAddress: smartWalletClient.account.address as IEthereumAddress,
                profile: getRandomProfile(),
              })

              logger.debug("User/Profile now created in the backend")
            } else {
              captureError(error)
            }
          })
          .catch(captureError)
      },
      {
        fireImmediately: true,
      },
    )

    return () => {
      unsubscribe()
    }
  }, [createUserAsync, privyUser, smartWalletClient])
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
