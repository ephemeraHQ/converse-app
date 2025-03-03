import { EntityObjectWithAddress } from "@queries/entify"
import { getCleanAddress } from "@utils/evm/getCleanAddress"
import type { InboxId, Member } from "@xmtp/react-native-sdk"
import { getAccountIsAdmin, getAccountIsSuperAdmin } from "./adminUtils"

export const sortGroupMembersByAdminStatus = (
  members: EntityObjectWithAddress<Member, InboxId> | undefined,
  currentAccount: string,
): { inboxId: InboxId; address: string }[] => {
  if (!members) {
    return []
  }
  const groupMembers = [...(members?.ids ?? [])]

  // Sorting group members to show admins & me first
  groupMembers.sort((a, b) => {
    const aIsAdmin = getAccountIsAdmin(members, a)
    const aIsSuperAdmin = getAccountIsSuperAdmin(members, a)
    const bIsAdmin = getAccountIsAdmin(members, b)
    const bIsSuperAdmin = getAccountIsSuperAdmin(members, b)

    if (aIsSuperAdmin && !bIsSuperAdmin) {
      return -1
    }
    if (bIsSuperAdmin && !aIsSuperAdmin) {
      return 1
    }
    if (aIsAdmin && !bIsAdmin) {
      return -1
    }
    if (bIsAdmin && !aIsAdmin) {
      return 1
    }
    if (a.toLowerCase() === currentAccount.toLowerCase()) {
      return -1
    }
    if (b.toLowerCase() === currentAccount.toLowerCase()) {
      return 1
    }
    if (a.toLowerCase() < b.toLowerCase()) {
      return -1
    }
    if (a.toLowerCase() > b.toLowerCase()) {
      return 1
    }
    return 0
  })
  return groupMembers.map((inboxId) => ({
    inboxId,
    // TODO: Multiple address support
    address: getCleanAddress(members.byId[inboxId].addresses[0]),
  }))
}
