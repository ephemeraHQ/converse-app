import { inboxId, Member } from "@xmtp/react-native-sdk";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";

import { EntityObjectWithAddress } from "../../queries/entify";
import { PermissionLevel } from "@xmtp/react-native-sdk/build/lib/Member";

export const getAccountIsAdmin = (
  members: EntityObjectWithAddress<Member, InboxId> | undefined,
  account: InboxId
) => {
  return (
    members?.byId[account]?.permissionLevel === "admin" ||
    members?.byId[account]?.permissionLevel === "super_admin"
  );
};

export const getAccountIsSuperAdmin = (
  members: EntityObjectWithAddress<Member, InboxId> | undefined,
  account: InboxId
) => {
  return members?.byId[account]?.permissionLevel === "super_admin";
};

const adminLevels: PermissionLevel[] = ["admin", "super_admin"] as const;
const superAdminLevels: PermissionLevel[] = ["super_admin"] as const;

const doesMemberHavePermissionLevel = (
  inboxId: string | undefined,
  members: EntityObjectWithAddress<Member, InboxId> | undefined,
  permissionLevels: PermissionLevel[]
) => {
  if (!inboxId) {
    return false;
  }
  const member = members?.byId[inboxId];
  if (!member) {
    return false;
  }
  return permissionLevels.includes(member.permissionLevel);
};

export const isUserAdminByInboxId = (
  inboxId: string | undefined,
  members: EntityObjectWithAddress<Member, InboxId> | undefined
) => {
  return doesMemberHavePermissionLevel(inboxId, members, adminLevels);
};

export const isUserSuperAdminByInboxId = (
  inboxId: string | undefined,
  members: EntityObjectWithAddress<Member, InboxId> | undefined
) => {
  return doesMemberHavePermissionLevel(inboxId, members, superAdminLevels);
};
