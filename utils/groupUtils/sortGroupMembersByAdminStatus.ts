import { XmtpGroupConversation } from "../../data/store/chatStore";

export const sortGroupMembersByAdminStatus = (
  group: XmtpGroupConversation,
  currentAccount: string
): string[] => {
  const groupMembers = [...group.groupMembers];
  const groupAdmins =
    typeof group.groupAdmins === "string"
      ? (group.groupAdmins as string).split(",")
      : group.groupAdmins;
  const groupSuperAdmins =
    typeof group.groupSuperAdmins === "string"
      ? (group.groupSuperAdmins as string).split(",")
      : group.groupSuperAdmins;
  // Sorting group members to show admins & me first
  groupMembers.sort((a, b) => {
    const aIsAdmin = groupAdmins?.some(
      (admin) => admin.toLowerCase() === a.toLowerCase()
    );
    const aIsSuperAdmin = groupSuperAdmins.some(
      (admin) => admin.toLowerCase() === a.toLowerCase()
    );
    const bIsAdmin = groupAdmins?.some(
      (admin) => admin.toLowerCase() === b.toLowerCase()
    );
    const bIsSuperAdmin = groupSuperAdmins?.some(
      (admin) => admin.toLowerCase() === b.toLowerCase()
    );

    if (aIsSuperAdmin && !bIsSuperAdmin) {
      return -1;
    }
    if (bIsSuperAdmin && !aIsSuperAdmin) {
      return 1;
    }
    if (aIsAdmin && !bIsAdmin) {
      return -1;
    }
    if (bIsAdmin && !aIsAdmin) {
      return 1;
    }
    if (a.toLowerCase() === currentAccount.toLowerCase()) {
      return -1;
    }
    if (b.toLowerCase() === currentAccount.toLowerCase()) {
      return 1;
    }
    if (a.toLowerCase() < b.toLowerCase()) {
      return -1;
    }
    if (a.toLowerCase() > b.toLowerCase()) {
      return 1;
    }
    return 0;
  });
  return groupMembers;
};
