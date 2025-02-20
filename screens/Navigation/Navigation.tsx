import { ConversationNavParams } from "@/features/conversation/conversation.nav";
// import {
//   InviteUsersToExistingGroupNav,
//   InviteUsersToExistingGroupParams,
// } from "@/features/groups/invite-to-group/InviteUsersToExistingGroup.nav";
import { ProfileNavParams } from "@/features/profiles/profile.nav";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform } from "react-native";

export type NavigationParamList = {
  Idle: undefined;

  // Auth / Onboarding
  OnboardingWelcome: undefined;
  OnboardingCreateContactCard: undefined;
  OnboardingNotifications: undefined;
  OnboardingGetStarted: undefined;

  // Main
  FakeScreen: undefined;
  Blocked: undefined;
  Chats: undefined;
  ChatsRequests: undefined;
  Conversation: ConversationNavParams;
  CreateConversation: undefined;

  NewGroupSummary: undefined;
  ConverseMatchMaker: undefined;
  ShareProfile: undefined;
  TopUp: undefined;
  Profile: ProfileNavParams;
  // InviteUsersToExistingGroup: InviteUsersToExistingGroupParams;
  UserProfile: undefined;

  // UI Tests
  Examples: undefined;

  AppSettings: undefined;
};

export const NativeStack = createNativeStackNavigator<NavigationParamList>();

export const navigationAnimation = Platform.OS === "ios" ? "default" : "none";
