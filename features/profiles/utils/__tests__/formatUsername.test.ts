import { formatUsername } from "../formatUsername";

describe("formatUsername", () => {
  it("should return undefined when no username provided", () => {
    const result = formatUsername(undefined);
    expect(result).toBeUndefined();
  });

  it("should format .conversedev.eth username by extracting first part and adding @ prefix", () => {
    const result = formatUsername("louisdev.conversedev.eth");
    expect(result).toBe("@louisdev");
  });

  it("should format .converse.xyz username by extracting first part and adding @ prefix", () => {
    const result = formatUsername("louisdev.converse.xyz");
    expect(result).toBe("@louisdev");
  });

  it("should return undefined for non-Converse usernames", () => {
    expect(formatUsername("louisdev.eth")).toBeUndefined();
    expect(formatUsername("louisdev")).toBeUndefined();
    expect(formatUsername("@louisdev")).toBeUndefined();
  });

  it("should return undefined for empty string", () => {
    const result = formatUsername("");
    expect(result).toBeUndefined();
  });
});
