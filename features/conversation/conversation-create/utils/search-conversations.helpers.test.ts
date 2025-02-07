import type { IProfileSocials } from "@/features/profiles/profile-types";
import {
  doesGroupNameMatchQuery,
  doesSocialsMatchQuery,
} from "./search-conversations.helpers";

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
    const mockSocials: IProfileSocials[] = [
      {
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
      },
    ];

    it("should match ENS name", () => {
      expect(
        doesSocialsMatchQuery({
          socials: mockSocials,
          normalizedQuery: "user.eth",
        })
      ).toBe(true);
    });

    it("should match Lens handle", () => {
      expect(
        doesSocialsMatchQuery({
          socials: mockSocials,
          normalizedQuery: "user.lens",
        })
      ).toBe(true);
    });

    it("should match Farcaster username", () => {
      expect(
        doesSocialsMatchQuery({
          socials: mockSocials,
          normalizedQuery: "user",
        })
      ).toBe(true);
    });

    it("should match Unstoppable Domain", () => {
      expect(
        doesSocialsMatchQuery({
          socials: mockSocials,
          normalizedQuery: "user.crypto",
        })
      ).toBe(true);
    });

    it("should match display name", () => {
      expect(
        doesSocialsMatchQuery({
          socials: mockSocials,
          normalizedQuery: "user one",
        })
      ).toBe(true);
    });

    it("should return false for non-matching query", () => {
      expect(
        doesSocialsMatchQuery({
          socials: mockSocials,
          normalizedQuery: "nomatch",
        })
      ).toBe(false);
    });
  });
});
