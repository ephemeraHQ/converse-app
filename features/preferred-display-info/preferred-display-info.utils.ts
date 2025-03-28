import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { IConvosProfile } from "@/features/profiles/profiles.types"
import { ISocialProfile } from "@/features/social-profiles/social-profiles.api"
import { Nullable } from "@/types/general"
import { IEthereumAddress } from "@/utils/evm/address"
import { shortAddress } from "@/utils/strings/shortAddress"

/**
 * Gets the preferred display name based on available profile data
 */
export function getPreferredDisplayName(args: {
  profile: Nullable<IConvosProfile>
  socialProfiles: Nullable<ISocialProfile[]>
  ethAddress: Nullable<IEthereumAddress>
  inboxId: Nullable<IXmtpInboxId>
}): string | undefined {
  const { profile, socialProfiles, ethAddress, inboxId } = args

  return (
    profile?.name || // First choice: Convos display name
    socialProfiles?.[0]?.name || // Second choice: First social profile name
    (ethAddress ? shortAddress(ethAddress) : undefined) || // Third choice: Ethereum address
    profile?.privyAddress || // Fourth choice: Ethereum address from Convos profile
    (inboxId ? shortAddress(inboxId) : undefined) // Fifth choice: Inbox ID
  )
}

/**
 * Gets the preferred avatar URL based on available profile data
 */
export function getPreferredAvatarUrl(args: {
  profile: Nullable<IConvosProfile>
  socialProfiles: Nullable<ISocialProfile[]>
}): string | undefined {
  const { profile, socialProfiles } = args

  return (
    profile?.avatar || // First choice: Convos avatar
    socialProfiles?.[0]?.avatar || // Second choice: First social profile avatar
    undefined
  )
}

/**
 * Gets the preferred Ethereum address based on available data
 */
export function getPreferredEthAddress(args: {
  profile: Nullable<IConvosProfile>
  socialProfiles: Nullable<ISocialProfile[]>
  ethAddress: Nullable<IEthereumAddress>
}): Nullable<IEthereumAddress> {
  const { profile, socialProfiles, ethAddress } = args

  return (
    ethAddress || // First choice: Directly provided Ethereum address
    profile?.privyAddress || // Second choice: Ethereum address from Convos profile
    socialProfiles?.[0]?.address // Third choice: Ethereum address from social profile
  )
}
