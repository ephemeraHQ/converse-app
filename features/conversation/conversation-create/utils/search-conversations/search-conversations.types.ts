import type { IProfileSocials } from "@/features/profiles/profile-types";
import type {
  ConversationTopic,
  ConversationVersion,
  InboxId,
} from "@xmtp/react-native-sdk";

export type SearchConversationsSearchableConversation = {
  version: ConversationVersion;
  topic: ConversationTopic;
  conversationName?: string;
  conversationImageUri?: string;
  memberProfiles: SearchConversationsMemberProfile[];
};

export type SearchConversationsMemberProfile = {
  inboxId: InboxId;
  socials: IProfileSocials[] | null;
};

export type SearchConversationsResults = {
  existingDmTopics: ConversationTopic[];
  existingGroupsByMemberNameTopics: ConversationTopic[];
  existingGroupsByGroupNameTopics: ConversationTopic[];
};
