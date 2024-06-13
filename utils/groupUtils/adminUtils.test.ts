import { XmtpGroupConversation } from "../../data/store/chatStore";
import { getAccountIsAdmin, getAccountIsSuperAdmin } from "./adminUtils";

describe("getAccountIsAdmin", () => {
  it("should return true if the account is an admin (array of admins)", () => {
    const group = {
      groupAdmins: ["0x123", "0x456"],
    } as unknown as XmtpGroupConversation;
    const account = "0x123";
    expect(getAccountIsAdmin(group, account)).toBe(true);
  });

  it("should return true if the account is an admin (string of admins)", () => {
    const group = {
      groupAdmins: "0x123,0x456",
    } as unknown as XmtpGroupConversation;
    const account = "0x123";
    expect(getAccountIsAdmin(group, account)).toBe(true);
  });

  it("should return false if the account is not an admin (array of admins)", () => {
    const group = {
      groupAdmins: ["0x123", "0x456"],
    } as unknown as XmtpGroupConversation;
    const account = "0x789";
    expect(getAccountIsAdmin(group, account)).toBe(false);
  });

  it("should return false if the account is not an admin (string of admins)", () => {
    const group = {
      groupAdmins: "0x123,0x456",
    } as unknown as XmtpGroupConversation;
    const account = "0x789";
    expect(getAccountIsAdmin(group, account)).toBe(false);
  });

  it("should handle case insensitive comparison (array of admins)", () => {
    const group = {
      groupAdmins: ["0x123", "0x456"],
    } as unknown as XmtpGroupConversation;
    const account = "0X123";
    expect(getAccountIsAdmin(group, account)).toBe(true);
  });

  it("should handle case insensitive comparison (string of admins)", () => {
    const group = {
      groupAdmins: "0x123,0x456",
    } as unknown as XmtpGroupConversation;
    const account = "0X123";
    expect(getAccountIsAdmin(group, account)).toBe(true);
  });
});

describe("getAccountIsSuperAdmin", () => {
  it("should return true if the account is a super admin (array of super admins)", () => {
    const group = {
      groupSuperAdmins: ["0x123", "0x456"],
    } as unknown as XmtpGroupConversation;
    const account = "0x123";
    expect(getAccountIsSuperAdmin(group, account)).toBe(true);
  });

  it("should return true if the account is a super admin (string of super admins)", () => {
    const group = {
      groupSuperAdmins: "0x123,0x456",
    } as unknown as XmtpGroupConversation;
    const account = "0x123";
    expect(getAccountIsSuperAdmin(group, account)).toBe(true);
  });

  it("should return false if the account is not a super admin (array of super admins)", () => {
    const group = {
      groupSuperAdmins: ["0x123", "0x456"],
    } as unknown as XmtpGroupConversation;
    const account = "0x789";
    expect(getAccountIsSuperAdmin(group, account)).toBe(false);
  });

  it("should return false if the account is not a super admin (string of super admins)", () => {
    const group = {
      groupSuperAdmins: "0x123,0x456",
    } as unknown as XmtpGroupConversation;
    const account = "0x789";
    expect(getAccountIsSuperAdmin(group, account)).toBe(false);
  });

  it("should handle case insensitive comparison (array of super admins)", () => {
    const group = {
      groupSuperAdmins: ["0x123", "0x456"],
    } as unknown as XmtpGroupConversation;
    const account = "0X123";
    expect(getAccountIsSuperAdmin(group, account)).toBe(true);
  });

  it("should handle case insensitive comparison (string of super admins)", () => {
    const group = {
      groupSuperAdmins: "0x123,0x456",
    } as unknown as XmtpGroupConversation;
    const account = "0X123";
    expect(getAccountIsSuperAdmin(group, account)).toBe(true);
  });
});
