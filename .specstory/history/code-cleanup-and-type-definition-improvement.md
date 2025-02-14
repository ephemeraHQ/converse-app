## SpecStory

## Code Cleanup and Type Definition Improvement (2/18/2025, 11:22:30 AM)

_**User**_

clean

---

_**Assistant**_

I'll help clean up the code following the provided guidelines. The main issues to address are the missing type and some structural improvements.

```typescript:features/conversation-list/hooks/use-message-plain-text.ts
import { useCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import {
  isGroupUpdatedMessage,
  isRemoteAttachmentMessage,
  isReplyMessage,
  isStaticAttachmentMessage,
} from "@/features/conversation/conversation-message/conversation-message.utils";
import { translate } from "@/i18n";
import {
  fetchInboxProfileSocialsQuery,
  getInboxProfileSocialsQueryData,
} from "@/queries/useInboxProfileSocialsQuery";
import { captureError } from "@/utils/capture-error";
import { getPreferredInboxAddress } from "@/utils/profile";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { logger } from "@utils/logger";
import {
  DecodedMessage,
  GroupUpdatedCodec,
  InboxId,
  ReplyCodec,
} from "@xmtp/react-native-sdk";
import { useEffect, useMemo } from "react";
import { z } from "zod";

// Define the Zod schema for profile socials
const ProfileSocialsSchema = z.object({
  // Add the actual fields here based on your schema
  address: z.string(),
  // ... other fields
});

type IProfileSocialsZodSchema = z.infer<typeof ProfileSocialsSchema>;

type HandleGroupMetadataChangeArgs = {
  initiatorName: string;
  content: ReturnType<GroupUpdatedCodec["decode"]>;
};

type HandleGroupMemberChangeArgs = {
  initiatorName: string;
  members: { inboxId: InboxId }[];
  type: "added" | "removed";
};

function handleGroupMetadataChange(args: HandleGroupMetadataChangeArgs) {
  const { initiatorName, content } = args;

  if (content.metadataFieldsChanged.length !== 1) {
    return translate("conversation_list.updated_the_group", {
      userName: initiatorName,
    });
  }

  const change = content.metadataFieldsChanged[0];
  const translations: Record<string, string> = {
    group_name: translate("conversation_list.name_changed", {
      userName: initiatorName,
      newValue: change.newValue,
    }),
    description: translate("conversation_list.description_changed", {
      userName: initiatorName,
      newValue: change.newValue,
    }),
    group_image_url_square: translate("conversation_list.image_changed", {
      userName: initiatorName,
    }),
  };

  return (
    translations[change

---



---

