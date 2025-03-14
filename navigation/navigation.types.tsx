import { ConversationNavParams } from "@/features/conversation/conversation-chat/conversation.nav"
import { AddGroupMembersNavParams } from "@/features/groups/group-details/add-group-members/add-group-members.nav"
import { GroupDetailsNavParams } from "@/features/groups/group-details/group-details.nav"
import { GroupMembersListNavParams } from "@/features/groups/group-details/members-list/group-members-list.nav"
// import {
//   InviteUsersToExistingGroupNav,
//   InviteUsersToExistingGroupParams,
// } from "@/features/groups/invite-to-group/InviteUsersToExistingGroup.nav";
import { ProfileNavParams } from "@/features/profiles/profile.nav"

export type NavigationParamList = {
  Idle: undefined

  // Auth
  Auth: undefined

  // Onboarding
  OnboardingWelcome: undefined
  OnboardingCreateContactCard: undefined
  OnboardingCreateContactCardImportName: undefined
  OnboardingNotifications: undefined
  OnboardingGetStarted: undefined

  // Main
  FakeScreen: undefined
  Blocked: undefined
  Chats: undefined
  ChatsRequests: undefined
  Conversation: ConversationNavParams
  CreateConversation: undefined
  GroupDetails: GroupDetailsNavParams
  AddGroupMembers: AddGroupMembersNavParams
  GroupMembersList: GroupMembersListNavParams

  NewGroupSummary: undefined
  ConverseMatchMaker: undefined
  ShareProfile: undefined
  TopUp: undefined
  Profile: ProfileNavParams
  ProfileImportInfo: undefined
  // InviteUsersToExistingGroup: InviteUsersToExistingGroupParams;
  UserProfile: undefined

  // UI Tests
  Examples: undefined

  AppSettings: undefined
  WebviewPreview: { uri: string }
}
