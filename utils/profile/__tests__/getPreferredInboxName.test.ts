import { getPreferredInboxName } from "../getPreferredInboxName";
import { type ProfileSocials } from "@data/store/profilesStore";

describe("getPreferredInboxName", () => {
  it("should return shortened address when no socials provided", () => {
    const result = getPreferredInboxName(null);
    expect(result).toBe("");

    const result2 = getPreferredInboxName(undefined);
    expect(result2).toBe("");

    const result3 = getPreferredInboxName([]);
    expect(result3).toBe("");
  });

  it("should return primary username if available", () => {
    const socials: ProfileSocials = {
      userNames: [
        {
          name: "test.cb.id",
          isPrimary: true,
          displayName: "Test User",
        },
      ],
    };
    const result = getPreferredInboxName([socials]);
    expect(result).toBe("Test User");
  });

  it("should return primary ENS name if no username", () => {
    const socials: ProfileSocials = {
      ensNames: [
        {
          name: "test.eth",
          isPrimary: true,
          displayName: "Test ENS",
        },
      ],
    };
    const result = getPreferredInboxName([socials]);
    expect(result).toBe("Test ENS");
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
    const result = getPreferredInboxName([socials]);
    expect(result).toBe("test.crypto");
  });

  it("should return shortened address if no primary names found", () => {
    const socials: ProfileSocials = {
      address: "0x1234567890123456789012345678901234567890",
    };
    const result = getPreferredInboxName([socials]);
    expect(result).toBe("0x1234...7890");
  });
});
