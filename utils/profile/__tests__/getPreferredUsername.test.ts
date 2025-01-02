import { getPreferredUsername } from "../getPreferredUsername";
import { type IProfileSocials } from "@/features/profiles/profile-types";

describe("getPreferredUsername", () => {
  it("should return undefined when no socials provided", () => {
    const result = getPreferredUsername(undefined);
    expect(result).toBeUndefined();
  });

  it("should return primary username if available", () => {
    const socials: IProfileSocials = {
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
    const socials: IProfileSocials = {
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
    const socials: IProfileSocials = {
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
    const socials: IProfileSocials = {
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
