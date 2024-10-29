import { ConversationNavParams } from "../screens/Navigation/ConversationNav";
import { GroupInviteNavParams } from "../screens/Navigation/GroupInviteNav";
import { GroupLinkNavParams } from "../screens/Navigation/GroupLinkNav";
import { GroupNavParams } from "../screens/Navigation/GroupNav";
import { NewConversationNavParams } from "../screens/Navigation/NewConversationNav";
import { ProfileNavParams } from "../screens/Navigation/ProfileNav";
import { ShareFrameNavParams } from "../screens/Navigation/ShareFrameNav";
import { WebviewPreviewNavParams } from "../screens/Navigation/WebviewPreviewNav";

export type NavigationParamList = {
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
