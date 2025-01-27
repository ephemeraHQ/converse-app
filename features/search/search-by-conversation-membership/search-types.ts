import type { ConversationVersion } from "@xmtp/react-native-sdk";
import type { IProfileSocials } from "@/features/profiles/profile-types";

export type SearchableConversation = {
  version: ConversationVersion;
  topic: string;
  conversationName?: string;
  conversationImageUri?: string;
  memberProfiles: MemberProfile[];
};

export type MemberProfile = {
  address: string;
  profile: IProfileSocials | null;
};

export type SearchResults = {
  existingDmSearchResults: Record<string, IProfileSocials>;
  existingGroupMemberNameSearchResults: Array<{
    memberNameFromGroup: string;
    groupName: string;
    groupId: string;
    groupImageUri: string;
    firstThreeMemberNames: string[];
  }>;
  existingGroupNameSearchResults: Array<{
    groupName: string;
    groupId: string;
    groupImageUri: string;
    firstThreeMemberNames: string[];
  }>;
};
