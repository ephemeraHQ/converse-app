import { IXmtpConversationId, IXmtpInboxId } from "@/features/xmtp/xmtp.types"

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
  Conversation: {
    xmtpConversationId?: IXmtpConversationId
    composerTextPrefill?: string
    searchSelectedUserInboxIds?: IXmtpInboxId[]
    isNew?: boolean
  }
  CreateConversation: undefined
  GroupDetails: {
    xmtpConversationId: IXmtpConversationId
  }
  AddGroupMembers: {
    xmtpConversationId: IXmtpConversationId
  }
  GroupMembersList: {
    xmtpConversationId: IXmtpConversationId
  }
  EditGroup: {
    xmtpConversationId: IXmtpConversationId
  }

  NewGroupSummary: undefined
  ShareProfile: undefined
  Profile: {
    inboxId: IXmtpInboxId
  }
  ProfileImportInfo: undefined
  // InviteUsersToExistingGroup: InviteUsersToExistingGroupParams;
  UserProfile: undefined

  // UI Tests
  Examples: undefined

  AppSettings: undefined
  WebviewPreview: { uri: string }
}
