## SpecStory

## Removing Group Invite Code from Codebase (2/19/2025, 10:05:14 AM)

_**User**_

Can you look at @Codebase  and delete all the files and stuff related to group invites

---

_**Assistant**_

I'll help you identify and remove group invite related code. Based on the codebase context, here are the files and code sections that should be deleted:

1. Delete entire files:
```
features/GroupInvites/groupInvites.utils.ts
features/GroupInvites/joinGroup/joinGroup.machine.ts
features/GroupInvites/joinGroup/joinGroup.machine.test.ts
features/GroupInvites/joinGroup/JoinGroup.client.ts
features/GroupInvites/joinGroup/joinGroup.types.ts
features/GroupInvites/joinGroup/joinGroup.md
```

2. Remove from `queries/QueryKeys.ts`:
```typescript:queries/QueryKeys.ts
// Remove these lines
export const groupInviteQueryKey = (account: string, inviteId: string) => [
  QueryKeys.GROUP_INVITE,
  account?.toLowerCase(),
  inviteId,
];
```

3. Remove from `queries/MutationKeys.ts`:
```typescript:queries/MutationKeys.ts
// Remove from enum
CREATE_GROUP_JOIN_REQUEST = "createGroupJoinRequest",

// Remove this function
export const createGroupJoinRequestMutationKey = (
  account: string,
  groupInviteId: string
) => [MutationKeys.CREATE_GROUP_JOIN_REQUEST, account, groupInviteId];
```

4. Delete entire files:
```
queries/useGroupInviteQuery.ts
queries/useCreateGroupJoinRequestMutation.ts
queries/useGroupPendingRequestsQuery.ts
hooks/useGroupPendingRequests.ts
hooks/useExistingGroupInviteLink.ts
```

5. Remove from `data/store/chatStore.ts`:
```typescript:data/store/chatStore.ts
// Remove these from ChatStoreType
groupInviteLinks: {
  [topic: string]: string;
};
setGroupInviteLink: (topic: string, inviteLink: string) => void;
deleteGroupInviteLink: (topic: string) => void;

// Remove from store implementation
groupInviteLinks: {},
setGroupInviteLink(topic, inviteLink) {
  set((state) => {
    const newGroupInvites = { ...state.groupInviteLinks };
    newGroupInvites[topic] = inviteLink;
    return { groupInviteLinks: newGroupInvites };
  });
},
deleteGroupInviteLink(topic) {
  set((state) => {
    const newGroupInvites = { ...state.groupInviteLinks };
    delete newGroupInvites[topic];
    return { groupInviteLinks: newGroupInvites };
  });
},
```

6. Remove from `utils/navigation.ts`:
```typescript:utils/navigation.ts
// Remove this function
const isGroupInviteLink = (url: string) => {
  // First check if it's a universal link
  for (const prefix of config.universalLinks) {
    if (url.startsWith(prefix)) {
      const path = url.slice(prefix.length);
      if (path.toLowerCase().startsWith("group-invite/")) {
        logger.debug("[Navigation] Found group invite universal link:", path);
        return true;
      }
    }
  }

  // Then check for deep link format with scheme
  if (url.includes("group-invite")) {
    logger.debug("[Navigation] Found group invite deep link:", url);
    return true;
  }

  logger.debug("[Navigation] Not a group invite link:", url);
  return false;
};
```

7. Remove from `screens/Navigation/navHelpers.ts`:
```typescript:screens/Navigation/navHelpers.ts
// Remove this section
if (pathForState?.startsWith("group-invite")) {
  const url = new URL(`https://${config.websiteDomain}/${pathForState}`);
  const params = new URLSearchParams(url.search);
  const inviteId = params.get("inviteId") || url.pathname.split("/")[1];
  if (inviteId) {
    return {
      routes: [
        {
          name: "GroupInvite",
          params: {
            groupInviteId: inviteId,
          },
        },
      ],
    };
  }
}
```

8. Remove from `i18n/translations/en.ts`:
```typescript:i18n/translations/en.ts
// Remove the "Group Invites" section
group_admin_approval: "A group admin may need to approve your membership prior to joining.",
joining: "Joining...",
join_group: "Join group",
group_join_error: "An error occurred",
group_join_invite_invalid: "This invite is no longer valid",
group_finished_polling_unsuccessfully: "Your request has been sent. Wait for the admin approve you",
group_already_joined: "This invite has already been accepted",
group_invite_default_group_name: "New Group",
```

9. Remove from `dependencies/Environment/Environment.ts`:
```typescript:dependencies/Environment/Environment.ts
// Remove the import
import { JoinGroupClient } from "../../features/GroupInvites/joinGroup/JoinGroup.client";

// Remove from Environment type
joinGroupClient: JoinGroupClient;
```

These changes will remove the group invite functionality from the codebase. Make sure to:
1. Update any tests that might reference these removed components
2. Remove any navigation routes related to group invites
3. Update any documentation that references group invites
4. Clean up any remaining imports of the deleted files

Would you like me to help identify any additional code that might need to be updated as a result of these deletions?

---



---

