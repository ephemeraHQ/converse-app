import { XmtpGroupConversation } from "../../data/store/chatStore";
import { sortGroupMembersByAdminStatus } from "./sortGroupMembersByAdminStatus";

describe("sortGroupMembersByAdminStatus", () => {
  const group: XmtpGroupConversation = {
    groupMembers: ["user1", "user2", "user3"],
    groupAdmins: ["user2", "user1"],
    groupSuperAdmins: ["user1"],
  } as any;

  test("should sort super admins and admins to the top", () => {
    const result = sortGroupMembersByAdminStatus(group, "user3");
    expect(result).toEqual(["user1", "user2", "user3"]);
  });

  test("should sort current user to the top if they are an admin", () => {
    const result = sortGroupMembersByAdminStatus(group, "user2");
    expect(result).toEqual(["user1", "user2", "user3"]);
  });

  test("should sort current user to the top if no admins", () => {
    const groupNoAdmins: XmtpGroupConversation = {
      groupMembers: ["user1", "user2", "user3"],
      groupAdmins: [],
      groupSuperAdmins: [],
    } as any;
    const result = sortGroupMembersByAdminStatus(groupNoAdmins, "user3");
    expect(result).toEqual(["user3", "user1", "user2"]);
  });

  test("should sort correctly when admins and super admins are mixed", () => {
    const mixedGroup: XmtpGroupConversation = {
      groupMembers: ["user1", "user2", "user3", "user4"],
      groupAdmins: ["user3", "user2"],
      groupSuperAdmins: ["user2"],
    } as any;
    const result = sortGroupMembersByAdminStatus(mixedGroup, "user4");
    expect(result).toEqual(["user2", "user3", "user4", "user1"]);
  });

  test("should sort alphabetically", () => {
    const mixedGroup: XmtpGroupConversation = {
      groupMembers: ["user5", "user1", "user2", "user3", "user4"],
      groupAdmins: ["user3", "user2"],
      groupSuperAdmins: ["user2"],
    } as any;
    const result = sortGroupMembersByAdminStatus(mixedGroup, "user4");
    expect(result).toEqual(["user2", "user3", "user4", "user1", "user5"]);
  });
});
