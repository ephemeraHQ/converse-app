import { getPreferredInboxAvatar } from "../getPreferredInboxAvatar";
import { type IProfileSocials } from "@/features/profiles/profile-types";

describe("getPreferredInboxAvatar", () => {
  it("should return undefined when no socials provided", () => {
    const result = getPreferredInboxAvatar(null);
    expect(result).toBeUndefined();

    const result2 = getPreferredInboxAvatar(undefined);
    expect(result2).toBeUndefined();

    const result3 = getPreferredInboxAvatar([]);
    expect(result3).toBeUndefined();
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
    const result = getPreferredInboxAvatar([socials]);
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
    const result = getPreferredInboxAvatar([socials]);
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
    const result = getPreferredInboxAvatar([socials]);
    expect(result).toBeUndefined();
  });

  it("should only use first social profile even if multiple provided", () => {
    const socials1: IProfileSocials = {
      userNames: [
        {
          name: "test1.cb.id",
          isPrimary: true,
          avatar: "https://test1.avatar.jpg",
        },
      ],
    };
    const socials2: IProfileSocials = {
      userNames: [
        {
          name: "test2.cb.id",
          isPrimary: true,
          avatar: "https://test2.avatar.jpg",
        },
      ],
    };
    const result = getPreferredInboxAvatar([socials1, socials2]);
    expect(result).toBe("https://test1.avatar.jpg");
  });
});
