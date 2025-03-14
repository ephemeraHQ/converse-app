import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { ReactNode } from "react"
import { z } from "zod"
import { IEthereumAddress } from "@/utils/evm/address"

// API Schemas
export const ConvosProfileForInboxSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
  description: z.string().nullable(),
  xmtpId: z.custom<IXmtpInboxId>(),
  avatar: z.string().nullable(),
  privyAddress: z.custom<IEthereumAddress>(),
})

export const ClaimProfileResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})

// API Types
export type IConvosProfileForInbox = z.infer<typeof ConvosProfileForInboxSchema>

export type ProfileUpdates = {
  name?: string
  username?: string
  description?: string | null
  avatar?: string | null
}

export type ProfileInput = ProfileUpdates & {
  id?: string
  xmtpId?: IXmtpInboxId
  privyAddress?: IEthereumAddress
}

export type ClaimProfileRequest = {
  name: string
  username: string
  description?: string
  avatar?: string
}

// UI Component Types
export type ProfileContactCardHandle = {
  handleSave: () => Promise<{ success: boolean; error?: string }>
  hasChanges: boolean
  isSaving: boolean
}

export type ICardLayoutProps = {
  avatar: ReactNode
  name: ReactNode
  additionalOptions?: ReactNode
}

export type IEditableContactCardProps = {
  displayName: string
  username: string
  description?: string
  avatarUri: string | undefined
  onAvatarPress: () => void
  onDisplayNameChange: (text: string) => void
  editableDisplayName: string
  isLoading: boolean
  error: string | undefined
  status: "error" | "disabled" | undefined
}

export type IReadOnlyContactCardProps = {
  displayName: string
  username: string
  description?: string
  avatarUri: string | undefined
}

export type IContactCardProps = {
  displayName: string
  username: string
  description?: string
  avatarUri: string | undefined
  isMyProfile: boolean
  editMode: boolean
  onAvatarPress: () => void
  onDisplayNameChange: (text: string) => void
  editableDisplayName: string
  isLoading: boolean
  error: string | undefined
  status: "error" | "disabled" | undefined
}

export type IProfileContactCardProps = {
  inboxId: IXmtpInboxId
}
