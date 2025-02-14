## SpecStory

## Function Replacement in Code (2/17/2025, 10:48:39 AM)

_**User**_

can you find all the places where "usePreferredUsername" is used and replace it with "usePreferredInboxName" from @usePreferredInboxName.ts ?

---

_**Assistant**_

I'll help search for usages of `usePreferredUsername` and replace them with `usePreferredInboxName`. However, there's an important difference to note - `usePreferredUsername` takes a `peerAddress` string parameter, while `usePreferredInboxName` takes an object with `inboxId`. We'll need to adapt the calls accordingly.

Could you share the files where `usePreferredUsername` is being used? The files weren't included in the open files, and I need to see them to make the correct replacements.

Please share those files and I'll help make the updates with the proper parameter conversion from `peerAddress` to `inboxId`.

---

_**User**_

you cannot search in by workspace?

---

_**Assistant**_

I apologize, but I can only see the contents of files that are explicitly shared with me using the `<open_file>` tags. I cannot search through your workspace.

To help you replace all instances of `usePreferredUsername` with `usePreferredInboxName`, could you please share the files where `usePreferredUsername` is being used? Specifically, I'd need to see the contents of:

1. utils/xmtpRN/xmtp-messages/xmtp-messages-stream.ts
2. features/streams/stream-messages.ts
3. design-system/Examples.tsx

Once you share these files, I can help make the correct replacements while handling the parameter conversion from `peerAddress` to `inboxId`.

---

_**User**_

is there a fast way to share those files with you?

---

_**Assistant**_

Yes, there are a few quick ways to share the files:

1. If you're using VS Code, you can use the "Copy Path" feature and paste the file contents with:
```
<open_file>path/to/file
```contents```
</open_file>
```

2. If you're using a command line, you can use something like:
```bash
for file in utils/xmtpRN/xmtp-messages/xmtp-messages-stream.ts features/streams/stream-messages.ts design-system/Examples.tsx; do
  echo "<open_file>$file"; 
  echo "\`\`\`typescript:$file"
  cat "$file"
  echo "\`\`\`"
  echo "</open_file>"
done
```

3. Many IDEs also have a "Copy File Contents" option in their right-click menu.

Once you share those files, I can help with the replacements.

---

_**User**_

does this help?



---

_**Assistant**_

Yes, this helps! I can see that `usePreferredUsername` is only used in `screens/ShareProfile.tsx`. Let's update that usage:

```typescript:screens/ShareProfile.tsx
// ... existing code ...
  const { userAddress } = route.params;
  // Remove this line
  // const username = usePreferredUsername(userAddress);
  // Replace with:
  const { data: username } = usePreferredInboxName({ inboxId: userAddress });
  const displayName = usePreferredName(userAddress);
// ... existing code ...
```

Note that this change assumes that `userAddress` can be used as an `inboxId`. If that's not the case, you might need to convert the address to an inboxId first. Let me know if you need help with that conversion.

Also, since `usePreferredUsername` is now unused, you might want to delete the file `hooks/usePreferredUsername.ts` entirely.

---

_**User**_

no, i want you to replace all the places i use usePreferredName with the hook exported from @usePreferredInboxName.ts 

Here are where usePreferredname is used:



---

_**Assistant**_

I'll help replace all usages of `usePreferredName` with `usePreferredInboxName`. From the code snippets, here are the files we need to update:

1. components/CurrentAccount.tsx:
```typescript:components/CurrentAccount.tsx
// ... existing code ...
  const account = useSafeCurrentSender().ethereumAddress;
  const { data: name } = usePreferredInboxName({ inboxId: account });
  const avatarUri = usePreferredAvatarUri(account);
// ... existing code ...
```

2. features/conversation-list/conversation-list.screen-header.tsx:
```typescript:features/conversation-list/conversation-list.screen-header.tsx
// ... existing code ...
  const currentAccount = useCurrentAccount();
  const { data: preferredName } = usePreferredInboxName({ inboxId: currentAccount! });
  const accountsProfilesNames = useAccountsProfiles();
// ... existing code ...
```

3. features/onboarding/screens/onboarding-notifications-screen.tsx:
```typescript:features/onboarding/screens/onboarding-notifications-screen.tsx
// ... existing code ...
  const { data: displayName } = usePreferredInboxName({ inboxId: currentAccount });
// ... existing code ...
```

4. screens/ShareProfile.tsx:
```typescript:screens/ShareProfile.tsx
// ... existing code ...
  const { data: username } = usePreferredInboxName({ inboxId: userAddress });
  const { data: displayName } = usePreferredInboxName({ inboxId: userAddress });
  const avatar = usePreferredAvatarUri(userAddress);
// ... existing code ...
```

Note: For `usePreferredNames` (plural) usages in GroupPendingRequestsTable.tsx, useGroupName.ts, and useAccountsProfiles.ts, we'll need a different approach since `usePreferredInboxName` only handles single IDs. Would you like me to create a new hook `usePreferredInboxNames` to handle multiple IDs?

Please share the actual files so I can provide more precise updates with proper context.

---

_**User**_

feel free to remove the import since you replaced

---

_**Assistant**_

I'll help remove the now-unused imports of `usePreferredName`. Here are the changes:

1. screens/ShareProfile.tsx:
```typescript:screens/ShareProfile.tsx
// Remove this import
- import { usePreferredName } from "@/hooks/usePreferredName";
```

2. features/conversation-list/conversation-list.screen-header.tsx:
```typescript:features/conversation-list/conversation-list.screen-header.tsx
// Remove this import
- import { usePreferredName } from "@/hooks/usePreferredName";
```

3. features/onboarding/screens/onboarding-notifications-screen.tsx:
```typescript:features/onboarding/screens/onboarding-notifications-screen.tsx
// Remove this import
- import { usePreferredName } from "@/hooks/usePreferredName";
```

4. components/CurrentAccount.tsx:
```typescript:components/CurrentAccount.tsx
// Remove this import
- import { usePreferredName } from "@/hooks/usePreferredName";
```

Since we've replaced all usages of `usePreferredName`, you can also delete the file `hooks/usePreferredName.ts` entirely if it's not being used elsewhere.

Would you like me to continue searching for other potential usages of `usePreferredName` to replace?

---



---

