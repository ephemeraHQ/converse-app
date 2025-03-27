import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { IConsentState } from "@/features/consent/consent.types"
import { IConversationBase } from "@/features/conversation/conversation.types"
import { EntityObject } from "@/utils/entify"

export type IGroupMember = {
  inboxId: IXmtpInboxId
  permission: "admin" | "super_admin" | "member"
  consentState: IConsentState
}

export type IGroupPermissionOption =
  | "allow" // Any members of the group can perform this action
  | "deny" // No members of the group can perform this action
  | "admin" // Only admins or super admins of the group can perform this action
  | "superAdmin" // Only the super admin of the group can perform this action
  | "unknown"

export type IGroupPermissionPolicySet = {
  addMemberPolicy: IGroupPermissionOption
  removeMemberPolicy: IGroupPermissionOption
  addAdminPolicy: IGroupPermissionOption
  removeAdminPolicy: IGroupPermissionOption
  updateGroupNamePolicy: IGroupPermissionOption
  updateGroupDescriptionPolicy: IGroupPermissionOption
  updateGroupImagePolicy: IGroupPermissionOption
  updateMessageDisappearingPolicy: IGroupPermissionOption
}

export type IGroup = IConversationBase & {
  type: "group"
  name: string
  description?: string
  imageUrl?: string
  addedByInboxId: IXmtpInboxId
  creatorInboxId: IXmtpInboxId
  members: EntityObject<IGroupMember, IXmtpInboxId>
}
