import { translate } from "@i18n"
import { PermissionPolicySet } from "@xmtp/react-native-sdk/build/lib/types/PermissionPolicySet"
import { userCanDoGroupActions } from "./userCanDoGroupActions"

type GetGroupMemberActionsProps = {
  groupPermissionLevel: PermissionPolicySet | undefined
  isCurrentUser: boolean
  isSuperAdmin: boolean
  isAdmin: boolean
  currentAccountIsSuperAdmin: boolean
  currentAccountIsAdmin: boolean
}

export const getGroupMemberActions = ({
  groupPermissionLevel,
  isCurrentUser,
  isSuperAdmin,
  isAdmin,
  currentAccountIsSuperAdmin,
  currentAccountIsAdmin,
}: GetGroupMemberActionsProps) => {
  const canRemove =
    !isCurrentUser &&
    userCanDoGroupActions(
      groupPermissionLevel,
      "removeMemberPolicy",
      currentAccountIsSuperAdmin,
      currentAccountIsAdmin,
    )
  const canPromoteToSuperAdmin = !isSuperAdmin && !isCurrentUser && currentAccountIsSuperAdmin
  const canPromoteToAdmin =
    !isCurrentUser &&
    !isAdmin &&
    !isSuperAdmin &&
    userCanDoGroupActions(
      groupPermissionLevel,
      "addAdminPolicy",
      currentAccountIsSuperAdmin,
      currentAccountIsAdmin,
    )

  const canRevokeAdmin =
    !isCurrentUser &&
    isAdmin &&
    !isSuperAdmin &&
    userCanDoGroupActions(
      groupPermissionLevel,
      "removeAdminPolicy",
      currentAccountIsSuperAdmin,
      currentAccountIsAdmin,
    )
  const canRevokeSuperAdmin = !isCurrentUser && currentAccountIsSuperAdmin && isSuperAdmin
  const options = [translate("group_screen_member_actions.profile_page")]
  let cancelButtonIndex = 1
  let promoteAdminIndex: number | undefined = undefined
  if (canPromoteToAdmin) {
    promoteAdminIndex = options.length
    options.push(translate("group_screen_member_actions.promote_to_admin"))
    cancelButtonIndex++
  }
  let promoteSuperAdminIndex: number | undefined = undefined
  if (canPromoteToSuperAdmin) {
    promoteSuperAdminIndex = options.length
    options.push(translate("group_screen_member_actions.promote_to_super_admin"))
    cancelButtonIndex++
  }
  let revokeAdminIndex: number | undefined = undefined
  if (canRevokeAdmin) {
    revokeAdminIndex = options.length
    options.push(translate("group_screen_member_actions.revoke_admin"))
    cancelButtonIndex++
  }
  let revokeSuperAdminIndex: number | undefined = undefined
  if (canRevokeSuperAdmin) {
    revokeSuperAdminIndex = options.length
    options.push(translate("group_screen_member_actions.revoke_super_admin"))
    cancelButtonIndex++
  }
  let removeIndex: number | undefined = undefined

  if (canRemove) {
    removeIndex = options.length
    options.push(translate("group_screen_member_actions.remove_member"))
    cancelButtonIndex++
  }
  options.push(translate("group_screen_member_actions.cancel"))
  const destructiveButtonIndex = canRemove ? options.length - 2 : undefined

  return {
    options,
    cancelButtonIndex,
    promoteAdminIndex,
    promoteSuperAdminIndex,
    revokeAdminIndex,
    revokeSuperAdminIndex,
    removeIndex,
    destructiveButtonIndex,
  }
}
