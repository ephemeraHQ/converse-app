import { ConversationNavParams } from "@/features/conversation/conversation.nav"
import { GroupDetailsNavParams } from "@/features/group-details/group-details.nav"
// import {
//   InviteUsersToExistingGroupNav,
//   InviteUsersToExistingGroupParams,
// } from "@/features/groups/invite-to-group/InviteUsersToExistingGroup.nav";
import { ProfileNavParams } from "@/features/profiles/profile.nav"

export type NavigationParamList = {
  Idle: undefined

  // Auth / Onboarding
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

  NewGroupSummary: undefined
  ConverseMatchMaker: undefined
  ShareProfile: undefined
  TopUp: undefined
  Profile: ProfileNavParams
  ProfileImportName: undefined
  // InviteUsersToExistingGroup: InviteUsersToExistingGroupParams;
  UserProfile: undefined

  // UI Tests
  Examples: undefined

  AppSettings: undefined
  WebviewPreview: { uri: string }
}
