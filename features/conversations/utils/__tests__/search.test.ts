import { dmMatchesSearchQuery, groupMatchesSearchQuery } from "../search";
import { getInboxProfileSocialsQueryData } from "@/queries/useInboxProfileSocialsQuery";
import type {
  DmWithCodecsType,
  GroupWithCodecsType,
} from "@/utils/xmtpRN/client";

// Mock getInboxProfileSocialsQueryData
jest.mock("@/queries/useInboxProfileSocialsQuery", () => ({
  getInboxProfileSocialsQueryData: jest.fn(),
}));

// Mock getPreferredInboxName
jest.mock("@/utils/profile", () => ({
  getPreferredInboxName: jest.fn((profiles) => profiles?.userNames?.[0] || ""),
}));

const mockGetInboxProfileSocialsQueryData =
  getInboxProfileSocialsQueryData as jest.Mock;

describe("Search Query Matchers", () => {
  const account = "testAccount";
  const searchQuery = "test";
  const mockInboxId = "mockInboxId";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("dmMatchesSearchQuery", () => {
    it("returns true if inboxId matches the search query", async () => {
      const mockDm = {
        peerInboxId: jest.fn().mockResolvedValue(mockInboxId),
        members: jest.fn().mockResolvedValue([]),
      } as unknown as DmWithCodecsType;

      mockGetInboxProfileSocialsQueryData.mockReturnValue([
        { userNames: ["testUser"] },
      ]);

      const result = await dmMatchesSearchQuery({
        account,
        searchQuery: "mockInbox",
        dm: mockDm,
      });
      expect(result).toBe(true);
    });

    it("returns true if a member's address matches the search query", async () => {
      const mockDm = {
        peerInboxId: jest.fn().mockResolvedValue("nonMatchingId"),
        members: jest.fn().mockResolvedValue([{ addresses: ["testAddress"] }]),
      } as unknown as DmWithCodecsType;

      mockGetInboxProfileSocialsQueryData.mockReturnValue(null);

      const result = await dmMatchesSearchQuery({
        account,
        searchQuery,
        dm: mockDm,
      });
      expect(result).toBe(true);
    });

    it("returns false if neither inboxId nor members match the search query", async () => {
      const mockDm = {
        peerInboxId: jest.fn().mockResolvedValue("nonMatchingId"),
        members: jest
          .fn()
          .mockResolvedValue([{ addresses: ["nonMatchingAddress"] }]),
      } as unknown as DmWithCodecsType;

      mockGetInboxProfileSocialsQueryData.mockReturnValue(null);

      const result = await dmMatchesSearchQuery({
        account,
        searchQuery,
        dm: mockDm,
      });
      expect(result).toBe(false);
    });
  });

  describe("groupMatchesSearchQuery", () => {
    it("returns true if group name matches the search query", async () => {
      const mockGroup = {
        name: "testGroupName",
        members: jest.fn().mockResolvedValue([]),
      } as unknown as GroupWithCodecsType;

      const result = await groupMatchesSearchQuery({
        account,
        searchQuery,
        group: mockGroup,
      });
      expect(result).toBe(true);
    });

    it("returns true if a member's inboxId matches the search query", async () => {
      const mockGroup = {
        name: "nonMatchingName",
        members: jest
          .fn()
          .mockResolvedValue([
            { inboxId: mockInboxId, addresses: ["nonMatchingAddress"] },
          ]),
      } as unknown as GroupWithCodecsType;

      mockGetInboxProfileSocialsQueryData.mockReturnValue([
        { userNames: ["testUser"] },
      ]);

      const result = await groupMatchesSearchQuery({
        account,
        searchQuery: "mockInbox",
        group: mockGroup,
      });
      expect(result).toBe(true);
    });

    it("returns true if a member's address matches the search query", async () => {
      const mockGroup = {
        name: "nonMatchingName",
        members: jest
          .fn()
          .mockResolvedValue([
            { inboxId: "nonMatchingId", addresses: ["testAddress"] },
          ]),
      } as unknown as GroupWithCodecsType;

      mockGetInboxProfileSocialsQueryData.mockReturnValue(null);

      const result = await groupMatchesSearchQuery({
        account,
        searchQuery,
        group: mockGroup,
      });
      expect(result).toBe(true);
    });

    it("returns false if neither group name, inboxId, nor members match the search query", async () => {
      const mockGroup = {
        name: "nonMatchingName",
        members: jest
          .fn()
          .mockResolvedValue([
            { inboxId: "nonMatchingId", addresses: ["nonMatchingAddress"] },
          ]),
      } as unknown as GroupWithCodecsType;

      mockGetInboxProfileSocialsQueryData.mockReturnValue(null);

      const result = await groupMatchesSearchQuery({
        account,
        searchQuery,
        group: mockGroup,
      });
      expect(result).toBe(false);
    });
  });
});
