import { Member } from "@xmtp/react-native-sdk";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";

import {
  getAccountIsAdmin,
  getAccountIsSuperAdmin,
  getAddressIsAdmin,
  getAddressIsSuperAdmin,
} from "./adminUtils"; // adjust the import path

type EntityObjectWithAddress<T, K extends string = string> = {
  byId: Record<K, T>;
  byAddress: Record<string, K>;
  ids: K[];
};

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
      permissionLevel: "super_admin",
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

describe("Permission Utilities", () => {
  describe("getAccountIsAdmin", () => {
    it("should return true if the account is an admin", () => {
      const result = getAccountIsAdmin(mockMembers, "member2" as InboxId);
      expect(result).toBe(true);
    });

    it("should return true if the account is a super admin", () => {
      const result = getAccountIsAdmin(mockMembers, "member3" as InboxId);
      expect(result).toBe(true);
    });

    it("should return false if the account is not an admin or super admin", () => {
      const result = getAccountIsAdmin(mockMembers, "member1" as InboxId);
      expect(result).toBe(false);
    });

    it("should return false if the members are undefined", () => {
      const result = getAccountIsAdmin(undefined, "member1" as InboxId);
      expect(result).toBe(false);
    });
  });

  describe("getAccountIsSuperAdmin", () => {
    it("should return true if the account is a super admin", () => {
      const result = getAccountIsSuperAdmin(mockMembers, "member3" as InboxId);
      expect(result).toBe(true);
    });

    it("should return false if the account is not a super admin", () => {
      const result = getAccountIsSuperAdmin(mockMembers, "member2" as InboxId);
      expect(result).toBe(false);
    });

    it("should return false if the members are undefined", () => {
      const result = getAccountIsSuperAdmin(undefined, "member1" as InboxId);
      expect(result).toBe(false);
    });
  });

  describe("getAddressIsAdmin", () => {
    it("should return true if the address belongs to an admin", () => {
      const result = getAddressIsAdmin(mockMembers, "address2");
      expect(result).toBe(true);
    });

    it("should return true if the address belongs to a super admin", () => {
      const result = getAddressIsAdmin(mockMembers, "address3");
      expect(result).toBe(true);
    });

    it("should return false if the address does not belong to an admin or super admin", () => {
      const result = getAddressIsAdmin(mockMembers, "address1");
      expect(result).toBe(false);
    });

    it("should return false if the members are undefined", () => {
      const result = getAddressIsAdmin(undefined, "address1");
      expect(result).toBe(false);
    });

    it("should return false if the address is not found", () => {
      const result = getAddressIsAdmin(mockMembers, "unknownAddress");
      expect(result).toBe(false);
    });
  });

  describe("getAddressIsSuperAdmin", () => {
    it("should return true if the address belongs to a super admin", () => {
      const result = getAddressIsSuperAdmin(mockMembers, "address3");
      expect(result).toBe(true);
    });

    it("should return false if the address does not belong to a super admin", () => {
      const result = getAddressIsSuperAdmin(mockMembers, "address2");
      expect(result).toBe(false);
    });

    it("should return false if the members are undefined", () => {
      const result = getAddressIsSuperAdmin(undefined, "address1");
      expect(result).toBe(false);
    });

    it("should return false if the address is not found", () => {
      const result = getAddressIsSuperAdmin(mockMembers, "unknownAddress");
      expect(result).toBe(false);
    });
  });
});
