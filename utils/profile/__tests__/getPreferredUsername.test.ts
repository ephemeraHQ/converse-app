import { getPreferredUsername } from "../getPreferredUsername";
import { type ProfileSocials } from "@data/store/profilesStore";

describe("getPreferredUsername", () => {
  it("should return undefined when no socials provided", () => {
    const result = getPreferredUsername(undefined);
    expect(result).toBeUndefined();
  });

  it("should return primary username if available", () => {
    const socials: ProfileSocials = {
      userNames: [
        {
          name: "test.cb.id",
          isPrimary: true,
        },
      ],
    };
    const result = getPreferredUsername(socials);
    expect(result).toBe("test.cb.id");
  });

  it("should return primary ENS name if no username", () => {
    const socials: ProfileSocials = {
      ensNames: [
        {
          name: "test.eth",
          isPrimary: true,
        },
      ],
    };
    const result = getPreferredUsername(socials);
    expect(result).toBe("test.eth");
  });

  it("should return primary unstoppable domain if no username or ENS", () => {
    const socials: ProfileSocials = {
      unstoppableDomains: [
        {
          domain: "test.crypto",
          isPrimary: true,
        },
      ],
    };
    const result = getPreferredUsername(socials);
    expect(result).toBe("test.crypto");
  });

  it("should return undefined if no primary identifier found", () => {
    const socials: ProfileSocials = {
      userNames: [
        {
          name: "test.cb.id",
          isPrimary: false,
        },
      ],
      ensNames: [
        {
          name: "test.eth",
          isPrimary: false,
        },
      ],
      unstoppableDomains: [
        {
          domain: "test.crypto",
          isPrimary: false,
        },
      ],
    };
    const result = getPreferredUsername(socials);
    expect(result).toBeUndefined();
  });
});
