export const getGroupMemberActions = (
  groupPermissionLevel: string,
  isCurrentUser: boolean,
  isSuperAdmin: boolean,
  isAdmin: boolean,
  currentAccountIsSuperAdmin: boolean,
  currentAccountIsAdmin: boolean
) => {
  const canRemove =
    !isCurrentUser &&
    ((currentAccountIsAdmin && !isSuperAdmin) ||
      currentAccountIsSuperAdmin ||
      groupPermissionLevel === "all_members");
  const canPromoteToSuperAdmin =
    currentAccountIsSuperAdmin && !isSuperAdmin && !isCurrentUser;
  const canPromoteToAdmin =
    !isCurrentUser && currentAccountIsSuperAdmin && !isAdmin && !isSuperAdmin;
  const canRevokeAdmin =
    !isCurrentUser && currentAccountIsSuperAdmin && isAdmin && !isSuperAdmin;
  const canRevokeSuperAdmin =
    !isCurrentUser && currentAccountIsSuperAdmin && isSuperAdmin;
  const options = ["Profile page"];
  let cancelButtonIndex = 1;
  let promoteAdminIndex: number | undefined = undefined;
  if (canPromoteToAdmin) {
    promoteAdminIndex = options.length;
    options.push("Promote to admin");
    cancelButtonIndex++;
  }
  let promoteSuperAdminIndex: number | undefined = undefined;
  if (canPromoteToSuperAdmin) {
    promoteSuperAdminIndex = options.length;
    options.push("Promote to super admin");
    cancelButtonIndex++;
  }
  let revokeAdminIndex: number | undefined = undefined;
  if (canRevokeAdmin) {
    revokeAdminIndex = options.length;
    options.push("Revoke admin");
    cancelButtonIndex++;
  }
  let revokeSuperAdminIndex: number | undefined = undefined;
  if (canRevokeSuperAdmin) {
    revokeSuperAdminIndex = options.length;
    options.push("Revoke super admin");
    cancelButtonIndex++;
  }
  let removeIndex: number | undefined = undefined;
  if (canRemove) {
    removeIndex = options.length;
    options.push("Remove from group");
    cancelButtonIndex++;
  }
  options.push("Cancel");
  const destructiveButtonIndex = canRemove ? options.length - 2 : undefined;

  return {
    options,
    cancelButtonIndex,
    promoteAdminIndex,
    promoteSuperAdminIndex,
    revokeAdminIndex,
    revokeSuperAdminIndex,
    removeIndex,
    destructiveButtonIndex,
  };
};
