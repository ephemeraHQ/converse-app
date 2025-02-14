## SpecStory

## Refactoring Component Props for Reusability (2/4/2025, 4:22:24 PM)

_**User**_

fix to have this component only have props like avatarUri, avatarName title, subtitle, onPress

---

_**Assistant**_

I'll help refactor the component to have simpler props and move the business logic to the parent component. Here's the simplified version:

```typescript:features/search/components/conversation-search-result-list-item.tsx
import { Pressable } from "@/design-system/Pressable";
import { VStack } from "@/design-system/VStack";
import { Avatar } from "@components/Avatar";
import { Text } from "@design-system/Text";
import { useAppTheme } from "@theme/useAppTheme";
import { useConversationSearchResultsListItemStyles } from "@/features/search/components/conversation-search-results-list-item.styles";

type ConversationSearchResultsListItemUserProps = {
  avatarUri?: string;
  avatarName?: string;
  title: string;
  subtitle: string;
  onPress: () => void;
};

/**
 * Search result list item for an individual user (as opposed to a group)
 * Figma: https://www.figma.com/design/p6mt4tEDltI4mypD3TIgUk/Converse-App?node-id=5191-4200&t=KDRZMuK1xpiNBKG9-11
 */
export function ConversationSearchResultsListItemUser({
  avatarUri,
  avatarName,
  title,
  subtitle,
  onPress,
}: ConversationSearchResultsListItemUserProps) {
  const { theme, themed } = useAppTheme();
  const conversationSearchResultsListItemStyles = useConversationSearchResultsListItemStyles();

  return (
    <Pressable onPress={onPress} withHaptics>
      <VStack style={themed(conversationSearchResultsListItemStyles.container)}>
        <Avatar
          uri={avatarUri}
          size={theme.avatarSize.md}
          style={themed(conversationSearchResultsListItemStyles.avatar)}
          name={avatarName}
        />
        <VStack>
          <Text preset="body" numberOfLines={1}>
            {title}
          </Text>
          <Text color="secondary" preset="small" numberOfLines={1}>
            {subtitle}
          </Text>
        </VStack>
      </VStack>
    </Pressable>
  );
}
```

The changes include:
1. Removed all business logic and data fetching hooks
2. Simplified props to be more generic and reusable
3. Renamed props to be more descriptive of their purpose
4. Component now only handles presentation concerns

The parent component will need to handle:
- Fetching preferred name and avatar
- Getting username
- Managing conversation store state
- Providing the formatted data to this component

This makes the component more reusable and follows the separation of concerns principle.

---



---

