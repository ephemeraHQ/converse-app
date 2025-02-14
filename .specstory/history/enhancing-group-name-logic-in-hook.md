## SpecStory

## Enhancing Group Name Logic in Hook (12/19/2024, 3:03:58 PM)

_**User**_

clean and put this logic in there

export function useGroupNameConvos(args: {
  topic: ConversationTopic;
  account: string;
}) {
  const { topic, account } = args;

  const { data: groupName, isLoading: groupNameLoading } = useGroupNameQuery({
    account,
    topic,
  });

  const { data: members, isLoading: membersLoading } = useGroupMembersQuery(
    account,
    topic
  );

  const memberAddresses = members?.ids
    .map((id) => members?.byId[id]?.addresses[0])
    .filter((address) => address !== account);

  const names = usePreferredNames(memberAddresses ?? []);

  return {
    groupName: groupName || names.join(", "),
    isLoading: groupNameLoading || membersLoading,
  };
}

---

_**Assistant**_

I'll help integrate the group members and preferred names logic into your existing `useGroupName` hook. Here's how to update it:

```typescript:hooks/useGroupName.ts
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { currentAccount } from "../data/store/accountsStore";
import { useGroupNameMutation } from "../queries/useGroupNameMutation";
import { useGroupNameQuery } from "../queries/useGroupNameQuery";
import { useGroupMembersQuery } from "../queries/useGroupMembersQuery";
import { usePreferredNames } from "./usePreferredNames";

export const useGroupName = (topic: ConversationTopic | undefined) => {
  const account = currentAccount();
  
  const { data: groupName, isLoading: groupNameLoading, isError } = useGroupNameQuery({
    account,
    topic: topic!,
  });

  const { data: members, isLoading: membersLoading } = useGroupMembersQuery(
    account,
    topic!
  );

  const memberAddresses = members?.ids
    .map((id) => members?.byId[id]?.addresses[0])
    .filter((address) => address !== account);

  const names = usePreferredNames(memberAddresses ?? []);
  
  const { mutateAsync } = useGroupNameMutation({
    account,
    topic: topic!,
  });

  return {
    groupName: groupName || names.join(", "),
    isLoading: groupNameLoading || membersLoading,
    isError,
    updateGroupName: mutateAsync,
  };
};
```

Key changes made:
1. Added imports for `useGroupMembersQuery` and `usePreferredNames`
2. Added members query with loading state
3. Added logic to extract and filter member addresses
4. Added preferred names hook
5. Modified the returned `groupName` to fallback to joined names if no group name is set
6. Updated `isLoading` to consider both queries' loading states

The hook now provides a fallback name (comma-separated list of member names) when no custom group name is set, while maintaining all the original functionality.

---



---

