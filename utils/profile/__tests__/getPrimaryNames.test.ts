import { getPrimaryNames } from "../getPrimaryNames";
import { type ProfileSocials } from "@data/store/profilesStore";

describe("getPrimaryNames", () => {
  it("should return empty array when no socials provided", () => {
    const result = getPrimaryNames(undefined);
    expect(result).toEqual([]);
  });

  it("should return primary usernames", () => {
    const socials: ProfileSocials = {
      userNames: [
        {
          name: "test.cb.id",
          isPrimary: true,
        },
        {
          name: "other.cb.id",
          isPrimary: false,
        },
      ],
    };
    const result = getPrimaryNames(socials);
    expect(result).toEqual(["test.cb.id"]);
  });

  it("should return primary ENS names", () => {
    const socials: ProfileSocials = {
      ensNames: [
        {
          name: "test.eth",
          isPrimary: true,
        },
        {
          name: "other.eth",
          isPrimary: false,
        },
      ],
    };
    const result = getPrimaryNames(socials);
    expect(result).toEqual(["test.eth"]);
  });

  it("should return primary unstoppable domains", () => {
    const socials: ProfileSocials = {
      unstoppableDomains: [
        {
          domain: "test.crypto",
          isPrimary: true,
        },
        {
          domain: "other.crypto",
          isPrimary: false,
        },
      ],
    };
    const result = getPrimaryNames(socials);
    expect(result).toEqual(["test.crypto"]);
  });

  it("should return farcaster usernames", () => {
    const socials: ProfileSocials = {
      farcasterUsernames: [
        {
          username: "test",
        },
      ],
    };
    const result = getPrimaryNames(socials);
    expect(result).toEqual(["test on farcaster"]);
  });

  it("should return lens handles", () => {
    const socials: ProfileSocials = {
      lensHandles: [
        {
          handle: "test",
          isDefault: true,
          profileId: "123",
        },
      ],
    };
    const result = getPrimaryNames(socials);
    expect(result).toEqual(["test on lens"]);
  });

  it("should return all primary names from multiple sources", () => {
    const socials: ProfileSocials = {
      userNames: [
        {
          name: "test.cb.id",
          isPrimary: true,
        },
      ],
      ensNames: [
        {
          name: "test.eth",
          isPrimary: true,
        },
      ],
      unstoppableDomains: [
        {
          domain: "test.crypto",
          isPrimary: true,
        },
      ],
      farcasterUsernames: [
        {
          username: "test",
        },
      ],
      lensHandles: [
        {
          handle: "test",
          isDefault: true,
          profileId: "123",
        },
      ],
    };
    const result = getPrimaryNames(socials);
    expect(result).toEqual([
      "test.cb.id",
      "test.eth",
      "test.crypto",
      "test on farcaster",
      "test on lens",
    ]);
  });
});