import { getPreferredName } from "../getPreferredName";
import { type IProfileSocials } from "@/features/profiles/profile-types";

describe("getPreferredName", () => {
  const testAddress = "0x1234567890123456789012345678901234567890";

  it("should return shortened address when no socials provided", () => {
    const result = getPreferredName(undefined, testAddress);
    expect(result).toBe("0x1234...7890");
  });

  it("should return primary username if available", () => {
    const socials: IProfileSocials = {
      userNames: [
        {
          name: "test.cb.id",
          displayName: "Test User",
          isPrimary: true,
        },
      ],
    };
    const result = getPreferredName(socials, testAddress);
    expect(result).toBe("Test User");
  });

  it("should return username without displayName if not available", () => {
    const socials: IProfileSocials = {
      userNames: [
        {
          name: "test.cb.id",
          isPrimary: true,
        },
      ],
    };
    const result = getPreferredName(socials, testAddress);
    expect(result).toBe("test.cb.id");
  });

  it("should return primary ENS name if no username", () => {
    const socials: IProfileSocials = {
      ensNames: [
        {
          name: "test.eth",
          displayName: "Test ENS",
          isPrimary: true,
        },
      ],
    };
    const result = getPreferredName(socials, testAddress);
    expect(result).toBe("Test ENS");
  });

  it("should return ENS name without displayName if not available", () => {
    const socials: IProfileSocials = {
      ensNames: [
        {
          name: "test.eth",
          isPrimary: true,
        },
      ],
    };
    const result = getPreferredName(socials, testAddress);
    expect(result).toBe("test.eth");
  });

  it("should return primary UNS domain if no username or ENS", () => {
    const socials: IProfileSocials = {
      unstoppableDomains: [
        {
          domain: "test.crypto",
          isPrimary: true,
        },
      ],
    };
    const result = getPreferredName(socials, testAddress);
    expect(result).toBe("test.crypto");
  });

  it("should return shortened address if no primary names found", () => {
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
    const result = getPreferredName(socials, testAddress);
    expect(result).toBe("0x1234...7890");
  });
});
