import { getPreferredInboxAddress } from "../getPreferredInboxAddress";
import { type ProfileSocials } from "@data/store/profilesStore";

describe("getPreferredInboxAddress", () => {
  it("should return undefined when no socials provided", () => {
    const result = getPreferredInboxAddress(null);
    expect(result).toBeUndefined();

    const result2 = getPreferredInboxAddress(undefined);
    expect(result2).toBeUndefined();

    const result3 = getPreferredInboxAddress([]);
    expect(result3).toBeUndefined();
  });

  it("should return address from first social profile", () => {
    const socials: ProfileSocials = {
      address: "0x123456789",
      userNames: [
        {
          name: "test.cb.id",
          isPrimary: true,
        },
      ],
    };
    const result = getPreferredInboxAddress([socials]);
    expect(result).toBe("0x123456789");
  });

  it("should return undefined if no address in socials", () => {
    const socials: ProfileSocials = {
      userNames: [
        {
          name: "test.cb.id",
          isPrimary: true,
        },
      ],
    };
    const result = getPreferredInboxAddress([socials]);
    expect(result).toBeUndefined();
  });

  it("should only use first social profile even if multiple provided", () => {
    const socials1: ProfileSocials = {
      address: "0x111111111",
    };
    const socials2: ProfileSocials = {
      address: "0x222222222",
    };
    const result = getPreferredInboxAddress([socials1, socials2]);
    expect(result).toBe("0x111111111");
  });
});
