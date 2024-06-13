import { XmtpGroupConversation } from "../../data/store/chatStore";

export const getAccountIsAdmin = (
  group: XmtpGroupConversation,
  account: string
) => {
  const groupAdmins: string[] =
    typeof group.groupAdmins === "string"
      ? (group.groupAdmins as string).split(",")
      : group.groupAdmins;
  return groupAdmins.some(
    (admin) => admin.toLowerCase() === account.toLowerCase()
  );
};

export const getAccountIsSuperAdmin = (
  group: XmtpGroupConversation,
  account: string
) => {
  const groupSuperAdmins: string[] =
    typeof group.groupSuperAdmins === "string"
      ? (group.groupSuperAdmins as string).split(",")
      : group.groupSuperAdmins;
  return groupSuperAdmins?.some(
    (admin) => admin.toLowerCase() === account.toLowerCase()
  );
};
