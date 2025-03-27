import { IGroupMember } from "@/features/groups/group.types"
import { IXmtpGroupMember, IXmtpInboxId } from "@/features/xmtp/xmtp.types"

export function convertXmtpGroupMemberToConvosMember(member: IXmtpGroupMember): IGroupMember {
  return {
    inboxId: member.inboxId as IXmtpInboxId,
    permission: member.permissionLevel,
    consentState: member.consentState,
  }
}
