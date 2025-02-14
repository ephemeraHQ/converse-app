## SpecStory

## Refactoring Code for Feature Structure (2/4/2025, 10:37:39 AM)

_**User**_

add @proposed package by feature structure.md 

---

_**Assistant**_

Based on the code snippets and the proposed package by feature structure, I'll help you refactor the code to better align with the architectural guidelines. Here's how we should modify the code:

1. First, let's move the profile socials query to the profiles feature folder:

````typescript:features/profiles/queries/profile-socials.queries.ts
import { IProfileSocials } from "../profile.types";
import { QueryKey, useQueries, useQuery } from "@tanstack/react-query";
import { getProfilesForAddresses } from "@/shared/utils/api/profiles";
import {
  create,
  windowedFiniteBatchScheduler,
  indexedResolver,
} from "@yornaath/batshit";
import { queryClient } from "@/shared/queries/queryClient";
import mmkv from "@/shared/utils/mmkv";

// ... rest of the code stays the same ...
````

2. Then update the conversation search results component:

````typescript:features/search/components/conversation-search-results-list-item-user.tsx
import { usePreferredInboxAddress } from "@/shared/hooks/usePreferredInboxAddress";
import { usePreferredInboxAvatar } from "@/shared/hooks/usePreferredInboxAvatar";
import { usePreferredInboxName } from "@/shared/hooks/usePreferredInboxName";
import { useProfileSocialsQuery } from "@/features/profiles/queries/profile-socials.queries";
import { shortAddress } from "@/shared/utils/strings/shortAddress";
import { Avatar } from "@/shared/components/Avatar";
import { Text } from "@/shared/design-system/Text";
import { ThemedStyle, useAppTheme } from "@/shared/styles/useAppTheme";
import { TextStyle, View, ViewStyle } from "react-native";

type UserSearchResultListItemProps = {
  inboxId: string;
};

/**
 * Search result list item for an individual user (as opposed to a group)
 * Figma: https://www.figma.com/design/p6mt4tEDltI4mypD3TIgUk/Converse-App?node-id=5191-4200&t=KDRZMuK1xpiNBKG9-11
 */
export function ConversationSearchResultsListItemUser({
  inboxId,
}: UserSearchResultListItemProps) {
  const { theme, themed } = useAppTheme();
  const { data: preferredName } = usePreferredInboxName({
    inboxId,
  });

  const { data: preferredAddress } = usePreferredInboxAddress({
    inboxId,
  });

  const { data: preferredAvatar } = usePreferredInboxAvatar({
    inboxId,
  });

  return (
    <View style={themed($container)}>
      <Avatar
        uri={preferredAvatar}
        size={theme.avatarSize.md}
        style={themed($avatar)}
        name={preferredName}
      />
      <View style={themed($textContainer)}>
        <Text preset="bodyBold" style={themed($primaryText)} numberOfLines={1}>
          {preferredName}
        </Text>
        <Text
          preset="formLabel"
          style={themed($secondaryText)}
          numberOfLines={1}
        >
          {shortAddress(inboxId)}
        </Text>
      </View>
    </View>
  );
}

// ... styles remain the same ...
````

Key changes made:

1. Moved profile socials query to `features/profiles/queries/` following the feature-based structure
2. Updated imports to use the new paths with `@/shared/` prefix for shared components and utilities
3. Removed unused imports and the incomplete `usesoci` line
4. Removed console.log statement as per the style guide
5. Maintained existing comments and styles

The changes align with the proposed package by feature structure while keeping the code functionality intact. The refactoring improves code organization by:

- Placing profile-related queries in the profiles feature folder
- Using proper import paths that reflect the new structure
- Following the style guide for clean, maintainable code

Let me know if you'd like me to explain any part of these changes in more detail!

---



---

