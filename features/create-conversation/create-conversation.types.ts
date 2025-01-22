import { IProfileSocials } from "../profiles/profile-types";

import { ConversationVersion } from "@xmtp/react-native-sdk";
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { NavigationParamList } from "@/screens/Navigation/Navigation";

export type CreateConversationNavigationProp = NativeStackNavigationProp<
  NavigationParamList,
  "CreateConversation"
>;

export type CreateConversationScreenProps = NativeStackScreenProps<
  NavigationParamList,
  "CreateConversation"
>;

export type SearchStatus = {
  message: string;
  profileSearchResults: Record<string, IProfileSocials>;
};

export type PendingChatMembers = {
  members: (IProfileSocials & { address: string })[];
};

export type PendingMembersSectionProps = {
  members: PendingChatMembers["members"];
  onRemoveMember: (address: string) => void;
};

export type SearchResultsSectionProps = {
  profiles: { [address: string]: IProfileSocials };
  onSelectProfile: (args: {
    socials: IProfileSocials;
    address: string;
  }) => void;
};

export type MessageSectionProps = {
  message: string;
  isError?: boolean;
};

export type ComposerSectionProps = {
  disabled: boolean;
  conversationMode: ConversationVersion;
  onSend: (content: { text: string }) => Promise<void>;
};
