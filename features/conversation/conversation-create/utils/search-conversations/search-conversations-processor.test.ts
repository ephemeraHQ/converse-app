import type { IProfileSocials } from "@/features/profiles/profile-types";
import { ConversationTopic, ConversationVersion } from "@xmtp/react-native-sdk";
import { searchByConversationMembershipProcessor } from "./search-conversations-processor";
import type { SearchConversationsSearchableConversation } from "./search-conversations.types";

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

describe("searchByConversationMembershipProcessor", () => {
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

  const mockDmConversation: SearchConversationsSearchableConversation = {
    version: ConversationVersion.DM,
    topic: "dm-topic" as ConversationTopic,
    memberProfiles: [
      { inboxId: currentUserAddress, socials: [] },
      { inboxId: "0xDmUser", socials: [mockDmProfile] },
    ],
  };

  const mockGroupConversation: SearchConversationsSearchableConversation = {
    version: ConversationVersion.GROUP,
    topic: "group-topic" as ConversationTopic,
    conversationName: "Test Group Chat",
    conversationImageUri: "https://example.com/group.jpg",
    memberProfiles: [
      { inboxId: currentUserAddress, socials: [] },
      { inboxId: "0xGroupUser1", socials: [mockGroupProfile1] },
      { inboxId: "0xGroupUser2", socials: [mockGroupProfile2] },
      { inboxId: "0xGroupUser3", socials: [mockGroupProfile3] },
    ],
  };

  describe("DM search", () => {
    it("should find DM conversations by ENS name", () => {
      const result = searchByConversationMembershipProcessor({
        conversations: [mockDmConversation],
        searchQuery: "dm.eth",
        currentUserInboxId: currentUserAddress,
      });

      expect(result.existingDmTopics).toEqual([mockDmConversation.topic]);
      expect(result.existingGroupsByMemberNameTopics).toEqual([]);
      expect(result.existingGroupsByGroupNameTopics).toEqual([]);
    });
  });

  describe("Group name search", () => {
    it("should exclude groups with /proto in name", () => {
      const protoGroup: SearchConversationsSearchableConversation = {
        ...mockGroupConversation,
        conversationName: "Test Group Chat/proto",
      };

      const result = searchByConversationMembershipProcessor({
        conversations: [protoGroup],
        searchQuery: "Test Group",
        currentUserInboxId: currentUserAddress,
      });

      expect(result.existingGroupsByGroupNameTopics).toEqual([]);
    });
  });

  describe("Group member search", () => {
    it("should not match when search query matches current user's profile in group", () => {
      const currentUserSocials: IProfileSocials = {
        address: currentUserAddress,
        ensNames: [
          {
            name: "current.eth",
            displayName: "Current User",
            isPrimary: true,
          },
        ],
        lensHandles: [],
        farcasterUsernames: [],
        unstoppableDomains: [],
        userNames: [],
      };

      const groupWithCurrentUser: SearchConversationsSearchableConversation = {
        ...mockGroupConversation,
        memberProfiles: [
          { inboxId: currentUserAddress, socials: [currentUserSocials] },
          { inboxId: "0xGroupUser1", socials: [mockGroupProfile1] },
          { inboxId: "0xGroupUser2", socials: [mockGroupProfile2] },
        ],
      };

      const result = searchByConversationMembershipProcessor({
        conversations: [groupWithCurrentUser],
        searchQuery: "current.eth",
        currentUserInboxId: currentUserAddress,
      });

      expect(result.existingDmTopics).toEqual([]);
      expect(result.existingGroupsByMemberNameTopics).toEqual([
        groupWithCurrentUser.topic,
      ]);
      expect(result.existingGroupsByGroupNameTopics).toEqual([]);
    });
  });
});
