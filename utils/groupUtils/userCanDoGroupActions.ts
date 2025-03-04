import type { PermissionPolicySet } from "@xmtp/react-native-sdk/build/lib/types/PermissionPolicySet"

type MemberRole = "admin" | "superAdmin" | "member"

type GetMemberRoleParams = {
  isSuperAdmin: boolean
  isAdmin: boolean
}

const getMemberRole = ({ isSuperAdmin, isAdmin }: GetMemberRoleParams): MemberRole => {
  if (isSuperAdmin) return "superAdmin"
  if (isAdmin) return "admin"
  return "member"
}

export const userCanDoGroupActions = (
  groupPermissionPolicy: PermissionPolicySet | undefined,
  action: keyof PermissionPolicySet,
  isSuperAdmin: boolean,
  isAdmin: boolean,
) => {
  const memberRole = getMemberRole({ isSuperAdmin, isAdmin })
  const policy = groupPermissionPolicy?.[action]
  // Edge cases
  if (policy === "allow") return true
  if (policy === "deny") return false
  if (policy === "admin" && (memberRole === "admin" || memberRole === "superAdmin")) return true
  if (policy === memberRole) return true
  return false
}
