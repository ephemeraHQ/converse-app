import type { IProfileSocials } from "@/features/profiles/profile.types";
import { doesSocialsMatchTextQuery } from "./does-socials-match-text-query";

describe("search-helpers", () => {
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
        doesSocialsMatchTextQuery({
          socials: mockSocials,
          normalizedQuery: "user.eth",
        })
      ).toBe(true);
    });

    it("should match Lens handle", () => {
      expect(
        doesSocialsMatchTextQuery({
          socials: mockSocials,
          normalizedQuery: "user.lens",
        })
      ).toBe(true);
    });

    it("should match Farcaster username", () => {
      expect(
        doesSocialsMatchTextQuery({
          socials: mockSocials,
          normalizedQuery: "user",
        })
      ).toBe(true);
    });

    it("should match Unstoppable Domain", () => {
      expect(
        doesSocialsMatchTextQuery({
          socials: mockSocials,
          normalizedQuery: "user.crypto",
        })
      ).toBe(true);
    });

    it("should match display name", () => {
      expect(
        doesSocialsMatchTextQuery({
          socials: mockSocials,
          normalizedQuery: "user one",
        })
      ).toBe(true);
    });

    it("should return false for non-matching query", () => {
      expect(
        doesSocialsMatchTextQuery({
          socials: mockSocials,
          normalizedQuery: "nomatch",
        })
      ).toBe(false);
    });
  });
});
