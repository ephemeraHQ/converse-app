import { processConversationSearch } from "./search-processor";
import type { SearchableConversation } from "./search-types";
import type { IProfileSocials } from "@/features/profiles/profile-types";
import { ConversationVersion } from "@xmtp/react-native-sdk";

// Mock XMTP SDK
jest.mock("@xmtp/react-native-sdk", () => ({
  ConversationVersion: {
    DM: "dm",
    GROUP: "group",
  },
}));

// Mock getReadableProfile since it's an external dependency
jest.mock("@/utils/getReadableProfile", () => ({
  getReadableProfile: jest.fn((address: string) => address),
}));

describe("processConversationSearch", () => {
  const currentUserAddress = "0xCurrentUser";

  const mockDmProfile: IProfileSocials = {
    address: "0xDmUser",
    ensNames: [{ name: "dm.eth", displayName: "DM User", isPrimary: true }],
    lensHandles: [],
    farcasterUsernames: [],
    unstoppableDomains: [],
    userNames: [],
  };

  const mockGroupProfile1: IProfileSocials = {
    address: "0xGroupUser1",
    ensNames: [
      { name: "group1.eth", displayName: "Group User 1", isPrimary: true },
    ],
    lensHandles: [],
    farcasterUsernames: [],
    unstoppableDomains: [],
    userNames: [],
  };

  const mockGroupProfile2: IProfileSocials = {
    address: "0xGroupUser2",
    ensNames: [
      { name: "group2.eth", displayName: "Group User 2", isPrimary: true },
    ],
    lensHandles: [],
    farcasterUsernames: [],
    unstoppableDomains: [],
    userNames: [],
  };

  const mockGroupProfile3: IProfileSocials = {
    address: "0xGroupUser3",
    ensNames: [
      { name: "group3.eth", displayName: "Group User 3", isPrimary: true },
    ],
    lensHandles: [],
    farcasterUsernames: [],
    unstoppableDomains: [],
    userNames: [],
  };

  const mockDmConversation: SearchableConversation = {
    version: ConversationVersion.DM,
    topic: "dm-topic",
    memberProfiles: [
      { address: currentUserAddress, profile: null },
      { address: "0xDmUser", profile: mockDmProfile },
    ],
  };

  const mockGroupConversation: SearchableConversation = {
    version: ConversationVersion.GROUP,
    topic: "group-topic",
    conversationName: "Test Group Chat",
    conversationImageUri: "https://example.com/group.jpg",
    memberProfiles: [
      { address: currentUserAddress, profile: null },
      { address: "0xGroupUser1", profile: mockGroupProfile1 },
      { address: "0xGroupUser2", profile: mockGroupProfile2 },
      { address: "0xGroupUser3", profile: mockGroupProfile3 },
    ],
  };

  describe("DM search", () => {
    it("should find DM conversations by ENS name", () => {
      const result = processConversationSearch(
        [mockDmConversation],
        "dm.eth",
        currentUserAddress
      );

      expect(result.existingDmSearchResults).toEqual([mockDmProfile]);
      expect(result.existingGroupMemberNameSearchResults).toEqual([]);
      expect(result.existingGroupNameSearchResults).toEqual([]);
    });

    it("should not match when search query matches current user's profile", () => {
      const currentUserProfile: IProfileSocials = {
        address: currentUserAddress,
        ensNames: [
          { name: "current.eth", displayName: "Current User", isPrimary: true },
        ],
        lensHandles: [],
        farcasterUsernames: [],
        unstoppableDomains: [],
        userNames: [],
      };

      const conversationWithCurrentUser: SearchableConversation = {
        ...mockDmConversation,
        memberProfiles: [
          { address: currentUserAddress, profile: currentUserProfile },
          { address: "0xDmUser", profile: mockDmProfile },
        ],
      };

      const result = processConversationSearch(
        [conversationWithCurrentUser],
        "current.eth", // Search for current user's ENS
        currentUserAddress
      );

      expect(result.existingDmSearchResults).toEqual([]);
      expect(result.existingGroupMemberNameSearchResults).toEqual([]);
      expect(result.existingGroupNameSearchResults).toEqual([]);
    });
  });

  describe("Group name search", () => {
    it("should find group by name with current user first in member list", () => {
      const result = processConversationSearch(
        [mockGroupConversation],
        "Test Group",
        currentUserAddress
      );

      expect(result.existingDmSearchResults).toEqual([]);
      expect(result.existingGroupMemberNameSearchResults).toEqual([]);
      expect(result.existingGroupNameSearchResults).toEqual([
        {
          groupName: "Test Group Chat",
          groupId: "group-topic",
          groupImageUri: "https://example.com/group.jpg",
          // Current user should be first, followed by up to 2 other members
          firstThreeMemberNames: [
            "0xCurrentUser",
            "0xGroupUser1",
            "0xGroupUser2",
          ],
        },
      ]);
    });

    it("should exclude groups with /proto in name", () => {
      const protoGroup: SearchableConversation = {
        ...mockGroupConversation,
        conversationName: "Test Group Chat/proto",
      };

      const result = processConversationSearch(
        [protoGroup],
        "Test Group",
        currentUserAddress
      );

      expect(result.existingGroupNameSearchResults).toEqual([]);
    });
  });

  describe("Group member search", () => {
    it("should find group by member ENS with matched member first in list", () => {
      const result = processConversationSearch(
        [mockGroupConversation],
        "group1.eth",
        currentUserAddress
      );

      expect(result.existingDmSearchResults).toEqual([]);
      expect(result.existingGroupNameSearchResults).toEqual([]);
      expect(result.existingGroupMemberNameSearchResults).toEqual([
        {
          memberNameFromGroup: "0xGroupUser1",
          groupName: "Test Group Chat",
          groupId: "group-topic",
          groupImageUri: "https://example.com/group.jpg",
          // Matched member should be first, followed by up to 2 other members
          firstThreeMemberNames: [
            "0xGroupUser1", // group1.eth user
            "0xGroupUser2", // group2.eth user
            "0xGroupUser3", // group3.eth user
          ],
        },
      ]);
    });

    it("should limit member list to 3 members total", () => {
      const largeGroup: SearchableConversation = {
        ...mockGroupConversation,
        memberProfiles: [
          { address: currentUserAddress, profile: null },
          { address: "0xGroupUser1", profile: mockGroupProfile1 },
          { address: "0xGroupUser2", profile: mockGroupProfile2 },
          { address: "0xGroupUser3", profile: mockGroupProfile3 },
          {
            address: "0xGroupUser4",
            profile: { ...mockGroupProfile1, address: "0xGroupUser4" },
          },
        ],
      };

      const result = processConversationSearch(
        [largeGroup],
        "group1.eth",
        currentUserAddress
      );

      expect(
        result.existingGroupMemberNameSearchResults[0].firstThreeMemberNames
      ).toHaveLength(3);
    });

    it("should not match when search query matches current user's profile in group", () => {
      const currentUserProfile: IProfileSocials = {
        address: currentUserAddress,
        ensNames: [
          { name: "current.eth", displayName: "Current User", isPrimary: true },
        ],
        lensHandles: [],
        farcasterUsernames: [],
        unstoppableDomains: [],
        userNames: [],
      };

      const groupWithCurrentUser: SearchableConversation = {
        ...mockGroupConversation,
        memberProfiles: [
          { address: currentUserAddress, profile: currentUserProfile },
          { address: "0xGroupUser1", profile: mockGroupProfile1 },
          { address: "0xGroupUser2", profile: mockGroupProfile2 },
        ],
      };

      const result = processConversationSearch(
        [groupWithCurrentUser],
        "current.eth", // Search for current user's ENS
        currentUserAddress
      );

      expect(result.existingDmSearchResults).toEqual([]);
      expect(result.existingGroupMemberNameSearchResults).toEqual([]);
      expect(result.existingGroupNameSearchResults).toEqual([]);
    });
  });
});
