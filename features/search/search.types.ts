import { IProfileSocials } from "../profiles/profile-types";

export type GroupNameSearchResult = {
  groupName: string;
  groupId: string;
  groupImageUri: string;
  firstThreeMemberNames: string[];
};

export type GroupMemberNameSearchResult = GroupNameSearchResult & {
  memberNameFromGroup: string;
};

export type IUserSearchResults = IConvosUsersSearchResult &
  IConversationMembershipSearchResult;

export type IConvosUsersSearchResult = {
  convosSearchResults?: Record<string, IProfileSocials>;
  message?: string;
};

export type IConversationMembershipSearchResult = {
  existingDmSearchResults?: Record<string, IProfileSocials>;
  existingGroupMemberNameSearchResults?: GroupMemberNameSearchResult[];
  existingGroupNameSearchResults?: GroupNameSearchResult[];
};
