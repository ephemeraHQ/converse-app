## SpecStory

## Refactoring Chat Group Update Components (11/14/2024, 11:43:51 AM)

_**User**_

ok instead of getting all the inboxProfiles ids, then looping through all the action etc... let's use "useInboxProfileSocialsQuery" so we'll loop through all the content stuff based on GroupUpdatedContent type but we'll have 1 component for each example ChatGroupUpdateMetaData, ChatGroupUpdateMemberJoined, ChatGroupUpdateMemberLeft

---

_**Assistant**_

I'll help you break this down into smaller, focused components. Here's how we can refactor this:

```typescript:components/Chat/ChatGroupUpdatedMessage.tsx
type IChatGroupUpdatedMessageProps = {
  content: GroupUpdatedContent;
};

export function ChatGroupUpdatedMessage({ content }: IChatGroupUpdatedMessageProps) {
  return (
    <VStack style={themed($container)}>
      {/* Member additions */}
      {content.membersAdded.map((member) => (
        <ChatGroupMemberJoined 
          key={`joined-${member.inboxId}`} 
          inboxId={member.inboxId as InboxId} 
        />
      ))}

      {/* Member removals */}
      {content.membersRemoved.map((member) => (
        <ChatGroupMemberLeft 
          key={`left-${member.inboxId}`} 
          inboxId={member.inboxId as InboxId} 
        />
      ))}

      {/* Metadata changes */}
      {content.metadataFieldsChanged.map((entry, index) => (
        <ChatGroupMetadataUpdate
          key={`metadata-${index}`}
          metadataEntry={entry}
          initiatorInboxId={content.initiatedByInboxId as InboxId}
        />
      ))}
    </VStack>
  );
}

// ... existing styles ...
```

Then create these new components:

```typescript:components/Chat/ChatGroupMemberJoined.tsx
type IChatGroupMemberJoinedProps = {
  inboxId: InboxId;
};

export function ChatGroupMemberJoined({ inboxId }: IChatGroupMemberJoinedProps) {
  const currentAccount = useCurrentAccount();
  const { data } = useInboxProfileSocialsQuery(currentAccount!, inboxId);
  const { theme } = useAppTheme();

  if (!data?.[0]) {
    return null;
  }

  const socials = data[0];
  const readableName = getPreferredName(socials, socials.address);
  
  return (
    <HStack style={{ alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
      <Pressable style={{ columnGap: theme.spacing.xxxs, alignItems: "center", flexDirection: "row" }}>
        <Avatar
          size={theme.layout.chat.messageSenderAvatar.width}
          uri={getPreferredAvatar(socials)}
          name={readableName}
        />
        <Text weight="bold" color="secondary" preset="smaller">
          {readableName}{" "}
        </Text>
      </Pressable>
      <Text color="secondary" preset="smaller">
        {translate("group_member_joined")}
      </Text>
    </HStack>
  );
}
```

```typescript:components/Chat/ChatGroupMemberLeft.tsx
type IChatGroupMemberLeftProps = {
  inboxId: InboxId;
};

// Similar structure to ChatGroupMemberJoined but with "group_member_left" translation
```

```typescript:components/Chat/ChatGroupMetadataUpdate.tsx
type IMetadataEntry = {
  fieldName: string;
  newValue: string;
};

type IChatGroupMetadataUpdateProps = {
  metadataEntry: IMetadataEntry;
  initiatorInboxId: InboxId;
};

export function ChatGroupMetadataUpdate({ metadataEntry, initiatorInboxId }: IChatGroupMetadataUpdateProps) {
  const currentAccount = useCurrentAccount();
  const { data } = useInboxProfileSocialsQuery(currentAccount!, initiatorInboxId);
  const { theme } = useAppTheme();

  if (!data?.[0]) {
    return null;
  }

  const socials = data[0];
  const readableName = getPreferredName(socials, socials.address);
  
  let txKey: TxKeyPath;
  let txParams: Record<string, string> = {};

  switch (metadataEntry.fieldName) {
    case "group_name":
      txKey = "group_name_changed_to";
      txParams = { newValue: metadataEntry.newValue };
      break;
    case "group_image_url_square":
      txKey = "group_photo_changed";
      break;
    case "description":
      txKey = "group_description_changed";
      txParams = { newValue: metadataEntry.newValue };
      break;
    default:
      return null;
  }

  return (
    <HStack style={{ alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
      <Pressable style={{ columnGap: theme.spacing.xxxs, alignItems: "center", flexDirection: "row" }}>
        <Avatar
          size={theme.layout.chat.messageSenderAvatar.width}
          uri={getPreferredAvatar(socials)}
          name={readableName}
        />
        <Text weight="bold" color="secondary" preset="smaller">
          {readableName}{" "}
        </Text>
      </Pressable>
      <Text color="secondary" preset="smaller">
        {translate(txKey, txParams)}
      </Text>
    </HStack>
  );
}
```

This refactoring:
1. Splits the logic into smaller, focused components
2. Uses individual `useInboxProfileSocialsQuery` calls instead of fetching all at once
3. Makes the code more maintainable and easier to test
4. Reduces complexity in the main component
5. Makes it easier to handle loading states and errors for each member separately

Each component handles its own data fetching and rendering, making the code more modular and following the single responsibility principle.

---



---

