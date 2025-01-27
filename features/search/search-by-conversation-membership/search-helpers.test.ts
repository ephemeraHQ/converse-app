import {
  doesGroupNameMatchQuery,
  doesMemberProfileMatchQuery,
} from "./search-helpers";
import type { IProfileSocials } from "@/features/profiles/profile-types";

describe("search-helpers", () => {
  describe("doesGroupNameMatchQuery", () => {
    it("should match exact group name", () => {
      expect(doesGroupNameMatchQuery("Test Group", "test group")).toBe(true);
    });

    it("should match partial group name", () => {
      expect(doesGroupNameMatchQuery("Awesome Chat", "some")).toBe(true);
    });

    it("should return false for undefined group name", () => {
      expect(doesGroupNameMatchQuery(undefined, "test")).toBe(false);
    });
  });

  describe("doesMemberProfileMatchQuery", () => {
    const mockProfile: IProfileSocials = {
      address: "0x123",
      ensNames: [
        { name: "user.eth", displayName: "User One", isPrimary: true },
      ],
      lensHandles: [
        {
          handle: "user.lens",
          profileId: "1",
          isDefault: true,
          name: "User Lens",
        },
      ],
      farcasterUsernames: [{ username: "user", name: "User FC" }],
      unstoppableDomains: [{ domain: "user.crypto", isPrimary: true }],
      userNames: [
        { name: "user123", displayName: "User Name", isPrimary: true },
      ],
    };

    it("should match ENS name", () => {
      expect(doesMemberProfileMatchQuery(mockProfile, "user.eth")).toBe(true);
    });

    it("should match Lens handle", () => {
      expect(doesMemberProfileMatchQuery(mockProfile, "user.lens")).toBe(true);
    });

    it("should match Farcaster username", () => {
      expect(doesMemberProfileMatchQuery(mockProfile, "user")).toBe(true);
    });

    it("should match Unstoppable Domain", () => {
      expect(doesMemberProfileMatchQuery(mockProfile, "user.crypto")).toBe(
        true
      );
    });

    it("should match display name", () => {
      expect(doesMemberProfileMatchQuery(mockProfile, "user one")).toBe(true);
    });

    it("should return false for non-matching query", () => {
      expect(doesMemberProfileMatchQuery(mockProfile, "nomatch")).toBe(false);
    });
  });
});
