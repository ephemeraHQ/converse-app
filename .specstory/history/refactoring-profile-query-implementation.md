## SpecStory

## Refactoring Profile Query Implementation (2/18/2025, 1:51:09 PM)

_**User**_

replace all the useInboxProfileSocialsQuery stuff with useProfileQuery and fix how we pass avatar and remove readbleName and firstSocials etc... we can access the name and avatarUrl from data: profile from the useProfileQuery

---

_**Assistant**_

I'll help you replace the `useInboxProfileSocialsQuery` with `useProfileQuery` and clean up the related code. Here are the changes:

```typescript:features/conversation/conversation-message/conversation-message-content-types/conversation-message-chat-group-update.tsx
// ... existing imports ...
// Remove these imports as they're no longer needed
// import { getPreferredAvatar, getPreferredName } from "@utils/profile";
// import { useInboxProfileSocialsQuery } from "@queries/useInboxProfileSocialsQuery";

// ... existing code until ChatGroupMemberJoined ...

function ChatGroupMemberJoined({ inboxId }: IChatGroupMemberJoinedProps) {
  const { themed, theme } = useAppTheme();

  const { data: profile } = useProfileQuery({
    xmtpId: inboxId,
  });

  if (!profile) {
    return null;
  }

  return (
    <HStack style={themed($memberContainer)}>
      <Pressable
        onPress={() => {
          navigate("Profile", {
            inboxId,
          });
        }}
        style={themed($pressableContent)}
      >
        <Avatar
          size={theme.avatarSize.xs}
          uri={profile.avatarUrl}
          name={profile.name}
        />
        <ChatGroupUpdateText weight="bold">{profile.name} </ChatGroupUpdateText>
      </Pressable>
      <ChatGroupUpdateText>
        {translate("group_member_joined")}
      </ChatGroupUpdateText>
    </HStack>
  );
}

// ... existing code until ChatGroupMetadataUpdate ...

function ChatGroupMetadataUpdate({
  metadataEntry,
  initiatorInboxId,
}: IChatGroupMetadataUpdateProps) {
  const { themed, theme } = useAppTheme();

  const { data: profile } = useProfileQuery({
    xmtpId: initiatorInboxId,
  });

  if (!profile) {
    return null;
  }

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
    <HStack style={themed($memberContainer)}>
      <Pressable
        onPress={() => {
          navigate("Profile", {
            inboxId: initiatorInboxId,
          });
        }}
        style={themed($pressableContent)}
      >
        <Avatar
          size={theme.avatarSize.xs}
          uri={profile.avatarUrl}
          name={profile.name}
        />
        <ChatGroupUpdateText weight="bold">{profile.name} </ChatGroupUpdateText>
      </Pressable>
      <ChatGroupUpdateText>{translate(txKey, txParams)}</ChatGroupUpdateText>
    </HStack>
  );
}

// ... rest of the existing code ...
```

The main changes made:
1. Removed the `useInboxProfileSocialsQuery` import and related code
2. Removed imports for `getPreferredAvatar` and `getPreferredName` as they're no longer needed
3. Replaced the socials query with `useProfileQuery` in both `ChatGroupMemberJoined` and `ChatGroupMetadataUpdate` components
4. Simplified the code by directly using `profile.name` and `profile.avatarUrl` from the profile data
5. Removed the `firstSocials` related code and simplified the null checks
6. Added theme to the destructuring in `ChatGroupMemberJoined`

These changes make the code cleaner and more consistent with the rest of the codebase by using the profile query directly.

---



---

