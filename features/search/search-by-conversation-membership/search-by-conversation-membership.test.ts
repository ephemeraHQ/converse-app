import { searchByConversationMembership } from "./search-by-conversation-membership";
import { ConversationVersion, ConversationTopic } from "@xmtp/react-native-sdk";
import { IProfileSocials } from "@/features/profiles/profile-types";
import {
  ConversationWithCodecsType,
  DmWithCodecsType,
  GroupWithCodecsType,
} from "@/utils/xmtpRN/client.types";

// Mock the ConversationVersion enum
jest.mock("@xmtp/react-native-sdk", () => ({
  ConversationVersion: {
    DM: "dm",
    GROUP: "group",
  },
  // Mock other exports that might be needed
  __esModule: true,
}));

// Mock the required functions and data
jest.mock("@/data/store/accountsStore", () => ({
  getCurrentAccount: () => "0xCurrentUserAddress",
}));

jest.mock("@/queries/use-conversations-query", () => ({
  getConversationsQueryData: jest.fn(),
}));

jest.mock("@/queries/useGroupMembersQuery", () => ({
  ensureGroupMembersQueryData: jest.fn(),
}));

jest.mock("@/queries/useProfileSocialsQuery", () => ({
  getProfileSocialsQueryData: jest.fn(),
}));

jest.mock("@/utils/getReadableProfile", () => ({
  getReadableProfile: jest.fn().mockReturnValue("User One"),
}));

// Test fixtures
const mockProfileSocials: IProfileSocials = {
  address: "0xUserAddress1",
  ensNames: [
    {
      name: "user1.eth",
      isPrimary: true,
      displayName: "User One",
    },
  ],
  farcasterUsernames: [
    {
      username: "user1",
      name: "User One FC",
    },
  ],
  lensHandles: [
    {
      profileId: "1",
      handle: "user1.lens",
      isDefault: true,
      name: "User One Lens",
    },
  ],
  unstoppableDomains: [
    {
      domain: "user1.crypto",
      isPrimary: true,
    },
  ],
  userNames: [
    {
      name: "user1",
      isPrimary: true,
      displayName: "User One Username",
    },
  ],
};

const mockGroupMemberProfileSocials: IProfileSocials = {
  address: "0xGroupMember1",
  ensNames: [
    {
      name: "groupmember.eth",
      isPrimary: true,
      displayName: "Group Member",
    },
  ],
  userNames: [
    {
      name: "groupmember",
      isPrimary: true,
      displayName: "Group Member Username",
    },
  ],
};

// Create mock topics using the ConversationTopic type
const mockDmTopic = "dm-topic-1" as unknown as ConversationTopic;
const mockGroupTopic = "group-topic-1" as unknown as ConversationTopic;

const mockDmConversation = {
  version: ConversationVersion.DM,
  topic: mockDmTopic,
  state: "allowed",
  clientInstallationId: "test-client-id",
  id: "dm-1",
  createdAt: new Date().getTime(),
  peerInboxId: "peer-inbox-1",
  members: () =>
    Promise.resolve([
      { inboxId: "peer-inbox-1", addresses: ["0xUserAddress1"] },
    ]),
  messages: () => Promise.resolve([]),
  send: () => Promise.resolve(),
  streamMessages: () => Promise.resolve(),
  syncUntil: () => Promise.resolve(),
} as unknown as DmWithCodecsType;

const mockGroupConversation = {
  version: ConversationVersion.GROUP,
  topic: mockGroupTopic,
  name: "Test Group",
  imageUrlSquare: "https://example.com/group.jpg",
  state: "allowed",
  clientInstallationId: "test-client-id",
  id: "group-1",
  createdAt: new Date().getTime(),
  isGroupActive: true,
  creatorInboxId: "creator-inbox-1",
  addedByInboxId: "creator-inbox-1",
  description: "Test group description",
  members: () =>
    Promise.resolve([
      { inboxId: "member-inbox-1", addresses: ["0xGroupMember1"] },
      { inboxId: "member-inbox-2", addresses: ["0xCurrentUserAddress"] },
    ]),
  messages: () => Promise.resolve([]),
  send: () => Promise.resolve(),
  streamMessages: () => Promise.resolve(),
  syncUntil: () => Promise.resolve(),
} as unknown as GroupWithCodecsType;

describe("searchByConversationMembership", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty results when no conversations exist", async () => {
    const {
      getConversationsQueryData,
    } = require("@/queries/use-conversations-query");
    getConversationsQueryData.mockResolvedValue(null);

    const result = await searchByConversationMembership({
      searchQuery: "test",
    });

    expect(result).toEqual({
      existingDmSearchResults: {},
      existingGroupMemberNameSearchResults: [],
      existingGroupNameSearchResults: [],
    });
  });

  it("should find DM conversations based on user metadata", async () => {
    const {
      getConversationsQueryData,
    } = require("@/queries/use-conversations-query");
    const {
      ensureGroupMembersQueryData,
    } = require("@/queries/useGroupMembersQuery");
    const {
      getProfileSocialsQueryData,
    } = require("@/queries/useProfileSocialsQuery");

    // Setup mocks
    getConversationsQueryData.mockResolvedValue([mockDmConversation]);
    ensureGroupMembersQueryData.mockResolvedValue({
      addresses: ["0xUserAddress1"],
    });
    getProfileSocialsQueryData.mockResolvedValue(mockProfileSocials);

    // Test searching by ENS name
    const result = await searchByConversationMembership({
      searchQuery: "user1.eth",
    });

    expect(result.existingDmSearchResults).toEqual({
      "0xUserAddress1": mockProfileSocials,
    });
    expect(result.existingGroupMemberNameSearchResults).toEqual([]);
    expect(result.existingGroupNameSearchResults).toEqual([]);

    // Verify the mocks were called correctly
    expect(getConversationsQueryData).toHaveBeenCalledWith({
      account: "0xCurrentUserAddress",
    });
    expect(ensureGroupMembersQueryData).toHaveBeenCalledWith({
      account: "0xCurrentUserAddress",
      topic: mockDmTopic,
    });
    expect(getProfileSocialsQueryData).toHaveBeenCalledWith("0xUserAddress1");
  });

  it("should find group conversations based on group name and member metadata", async () => {
    const {
      getConversationsQueryData,
    } = require("@/queries/use-conversations-query");
    const {
      ensureGroupMembersQueryData,
    } = require("@/queries/useGroupMembersQuery");
    const {
      getProfileSocialsQueryData,
    } = require("@/queries/useProfileSocialsQuery");

    // Setup mocks
    getConversationsQueryData.mockResolvedValue([mockGroupConversation]);
    ensureGroupMembersQueryData.mockResolvedValue({
      addresses: ["0xGroupMember1", "0xCurrentUserAddress"],
    });
    getProfileSocialsQueryData.mockImplementation((address: string) => {
      if (address === "0xGroupMember1") return mockGroupMemberProfileSocials;
      return null;
    });

    // Test searching by group name
    let result = await searchByConversationMembership({
      searchQuery: "Test Group",
    });

    expect(result.existingGroupNameSearchResults).toEqual([
      {
        groupName: "Test Group",
        groupId: mockGroupTopic,
        groupImageUri: "https://example.com/group.jpg",
        firstThreeMemberNames: ["User One"],
      },
    ]);

    // Test searching by group member metadata
    result = await searchByConversationMembership({
      searchQuery: "groupmember.eth",
    });

    expect(result.existingGroupMemberNameSearchResults).toEqual([
      {
        memberNameFromGroup: "User One",
        groupName: "Test Group",
        groupId: mockGroupTopic,
        groupImageUri: "https://example.com/group.jpg",
        firstThreeMemberNames: ["User One"],
      },
    ]);

    // Verify the mocks were called correctly
    expect(getConversationsQueryData).toHaveBeenCalledWith({
      account: "0xCurrentUserAddress",
    });
    expect(ensureGroupMembersQueryData).toHaveBeenCalledWith({
      account: "0xCurrentUserAddress",
      topic: mockGroupTopic,
    });
    expect(getProfileSocialsQueryData).toHaveBeenCalledWith("0xGroupMember1");
  });
});
