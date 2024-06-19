import { Member } from "@xmtp/react-native-sdk";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";

import { EntityObjectWithAddress } from "../../queries/entify";
import { getAccountIsAdmin, getAccountIsSuperAdmin } from "./adminUtils";
import { sortGroupMembersByAdminStatus } from "./sortGroupMembersByAdminStatus"; // adjust the import path

jest.mock("./adminUtils", () => ({
  getAccountIsAdmin: jest.fn(),
  getAccountIsSuperAdmin: jest.fn(),
}));

describe("sortGroupMembersByAdminStatus", () => {
  const mockMembers: EntityObjectWithAddress<Member, InboxId> = {
    byId: {
      member1: {
        inboxId: "member1",
        addresses: ["address1"],
        permissionLevel: "member",
      },
      member2: {
        inboxId: "member2",
        addresses: ["address2"],
        permissionLevel: "admin",
      },
      member3: {
        inboxId: "member3",
        addresses: ["address3"],
        permissionLevel: "super-admin",
      },
      member4: {
        inboxId: "member4",
        addresses: ["address4"],
        permissionLevel: "member",
      },
    },
    byAddress: {
      address1: "member1",
      address2: "member2",
      address3: "member3",
      address4: "member4",
    },
    ids: ["member1", "member2", "member3", "member4"],
  } as unknown as EntityObjectWithAddress<Member, InboxId>;

  beforeEach(() => {
    (getAccountIsAdmin as jest.Mock).mockImplementation((members, id) => {
      return members.byId[id].permissionLevel === "admin";
    });
    (getAccountIsSuperAdmin as jest.Mock).mockImplementation((members, id) => {
      return members.byId[id].permissionLevel === "super-admin";
    });
  });

  it("should return an empty array if members are undefined", () => {
    const result = sortGroupMembersByAdminStatus(undefined, "currentAccount");
    expect(result).toEqual([]);
  });

  it("should sort members with super-admins first, then admins, then the current account, and then others", () => {
    const result = sortGroupMembersByAdminStatus(mockMembers, "member1");

    expect(result).toEqual([
      { inboxId: "member3", address: "address3" }, // super-admin
      { inboxId: "member2", address: "address2" }, // admin
      { inboxId: "member1", address: "address1" }, // current account
      { inboxId: "member4", address: "address4" }, // member
    ]);
  });

  it("should handle case where current account is not in members", () => {
    const result = sortGroupMembersByAdminStatus(
      mockMembers,
      "nonexistentAccount"
    );

    expect(result).toEqual([
      { inboxId: "member3", address: "address3" }, // super-admin
      { inboxId: "member2", address: "address2" }, // admin
      { inboxId: "member1", address: "address1" }, // member
      { inboxId: "member4", address: "address4" }, // member
    ]);
  });

  it("should handle case where multiple members have the same permission level", () => {
    const customMockMembers = {
      ...mockMembers,
      byId: {
        ...mockMembers.byId,
        member5: {
          inboxId: "member5",
          addresses: ["address5"],
          permissionLevel: "admin",
        },
      },
      ids: [...mockMembers.ids, "member5"],
    } as unknown as EntityObjectWithAddress<Member, InboxId>;

    const result = sortGroupMembersByAdminStatus(customMockMembers, "member1");

    expect(result).toEqual([
      { inboxId: "member3", address: "address3" }, // super-admin
      { inboxId: "member2", address: "address2" }, // admin
      { inboxId: "member5", address: "address5" }, // admin
      { inboxId: "member1", address: "address1" }, // current account
      { inboxId: "member4", address: "address4" }, // member
    ]);
  });
});
