import { IGroupMember } from "@/features/groups/group.types"

export const getGroupMemberIsAdmin = (args: { member: IGroupMember }) => {
  return args.member.permission === "admin" || args.member.permission === "super_admin"
}

export const getGroupMemberIsSuperAdmin = (args: { member: IGroupMember }) => {
  return args.member.permission === "super_admin"
}
