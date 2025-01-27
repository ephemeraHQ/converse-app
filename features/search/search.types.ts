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
  convosSearchResults?: Array<IProfileSocials>;
  message?: string;
};

export type IConversationMembershipSearchResult = {
  existingDmSearchResults?: Array<IProfileSocials>;
  existingGroupMemberNameSearchResults?: Array<GroupMemberNameSearchResult>;
  existingGroupNameSearchResults?: Array<GroupNameSearchResult>;
};
