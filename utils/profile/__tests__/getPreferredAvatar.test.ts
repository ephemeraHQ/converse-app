import { getPreferredAvatar } from "../getPreferredAvatar";
import { type IProfileSocials } from "@/features/profiles/profile-types";

describe("getPreferredAvatar", () => {
  it("should return undefined when no socials provided", () => {
    const result = getPreferredAvatar(undefined);
    expect(result).toBeUndefined();
  });

  it("should return primary username avatar if available", () => {
    const socials: IProfileSocials = {
      userNames: [
        {
          name: "test.cb.id",
          isPrimary: true,
          avatar: "https://test.avatar.jpg",
        },
      ],
    };
    const result = getPreferredAvatar(socials);
    expect(result).toBe("https://test.avatar.jpg");
  });

  it("should return primary ENS avatar if no username avatar", () => {
    const socials: IProfileSocials = {
      ensNames: [
        {
          name: "test.eth",
          isPrimary: true,
          avatar: "https://ens.avatar.jpg",
        },
      ],
    };
    const result = getPreferredAvatar(socials);
    expect(result).toBe("https://ens.avatar.jpg");
  });

  it("should return undefined if no primary avatar found", () => {
    const socials: IProfileSocials = {
      userNames: [
        {
          name: "test.cb.id",
          isPrimary: false,
          avatar: "https://test.avatar.jpg",
        },
      ],
      ensNames: [
        {
          name: "test.eth",
          isPrimary: false,
          avatar: "https://ens.avatar.jpg",
        },
      ],
    };
    const result = getPreferredAvatar(socials);
    expect(result).toBeUndefined();
  });
});
