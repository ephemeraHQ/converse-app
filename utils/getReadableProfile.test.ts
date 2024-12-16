import { getProfileSocialsQueryData } from "@/queries/useProfileSocialsQuery";
import { getReadableProfile } from "./getReadableProfile";

jest.mock("@/queries/useProfileSocialsQuery", () => ({
  getProfileSocialsQueryData: jest.fn(),
}));

describe("getReadableProfile", () => {
  it("should return the preferred name for the account", () => {
    const mockGetProfilesStore = getProfileSocialsQueryData as jest.Mock;
    mockGetProfilesStore.mockReturnValue({
      socials: "socials",
    });

    expect(getReadableProfile("account", "0x123")).toBe("0x123");
  });
});
