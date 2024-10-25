import { ConversationNavParams } from "./Navigation/ConversationNav";
import { GroupInviteNavParams } from "./Navigation/GroupInviteNav";
import { GroupLinkNavParams } from "./Navigation/GroupLinkNav";
import { GroupNavParams } from "./Navigation/GroupNav";
import { NewConversationNavParams } from "./Navigation/NewConversationNav";
import { ProfileNavParams } from "./Navigation/ProfileNav";
import { ShareFrameNavParams } from "./Navigation/ShareFrameNav";
import { WebviewPreviewNavParams } from "./Navigation/WebviewPreviewNav";

export type NavigationParamList = {
  //   Idle: undefined;

  // Auth / Onboarding
  OnboardingGetStarted: undefined;
  OnboardingPrivy: undefined;
  OnboardingConnectWallet: {
    address: string;
  };
  OnboardingPrivateKey: undefined;
  OnboardingNotifications: undefined;
  OnboardingEphemeral: undefined;
  OnboardingUserProfile: undefined;

  // Main
  ConversationList: undefined;
  Accounts: undefined;
  Blocked: undefined;
  Chats: undefined;
  ChatsRequests: undefined;
  Conversation: ConversationNavParams;
  NewConversation: NewConversationNavParams;
  NewGroupSummary: undefined;
  ConverseMatchMaker: undefined;
  ShareProfile: undefined;
  ShareFrame: ShareFrameNavParams;
  TopUp: undefined;
  Profile: ProfileNavParams;
  Group: GroupNavParams;
  GroupLink: GroupLinkNavParams;
  GroupInvite: GroupInviteNavParams;
  UserProfile: undefined;
  WebviewPreview: WebviewPreviewNavParams;
  NewAccount: undefined;
};
