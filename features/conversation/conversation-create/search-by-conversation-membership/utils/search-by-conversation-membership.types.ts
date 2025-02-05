import type { IProfileSocials } from "@/features/profiles/profile-types";
import type {
  ConversationTopic,
  ConversationVersion,
  InboxId,
} from "@xmtp/react-native-sdk";

export type SearchableConversation = {
  version: ConversationVersion;
  topic: ConversationTopic;
  conversationName?: string;
  conversationImageUri?: string;
  memberProfiles: MemberProfile[];
};

export type MemberProfile = {
  inboxId: InboxId;
  socials: IProfileSocials[] | null;
};

export type SearchResults = {
  existingDmTopics: ConversationTopic[];
  existingGroupsByMemberNameTopics: ConversationTopic[];
  existingGroupsByGroupNameTopics: ConversationTopic[];
};
