## SpecStory

## Fixing Jest Module Import Error (2/5/2025, 10:32:17 AM)

_**User**_

fix: 


    Cannot find module '../../../../../queries/use-conversations-query' from 'features/conversation/conversation-create/search-by-conversation-membership/utils/search-by-conversation-membership.test.ts'

      22 | }));
      23 |
    > 24 | jest.mock("@/queries/use-conversations-query", () => ({
         |      ^
      25 |   getConversationsQueryData: jest.fn(),
      26 | }));
      27 |

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/resolver.js:427:11)
      at Object.mock (features/conversation/conversation-create/search-by-conversation-membership/utils/search-by-conversation-membership.test.ts:24:6)

---

_**Assistant**_

I'll help fix the import path issue. The error occurs because Jest can't find the module with the `@/` alias path. We need to update the mock paths to use relative paths instead of the `@/` alias in Jest tests.

Here's how to fix the imports in the test file:

```typescript:features/conversation/conversation-create/search-by-conversation-membership/utils/search-by-conversation-membership.test.ts
// ... existing code ...

// Update mock paths to use relative paths
jest.mock("../../../../../data/store/accountsStore", () => ({
  getCurrentAccount: () => "0xCurrentUserAddress",
}));

jest.mock("../../../../../queries/use-conversations-query", () => ({
  getConversationsQueryData: jest.fn(),
}));

jest.mock("../../../../../queries/useGroupMembersQuery", () => ({
  ensureGroupMembersQueryData: jest.fn(),
}));

jest.mock("../../../../../queries/useProfileSocialsQuery", () => ({
  getProfileSocialsQueryData: jest.fn(),
}));

jest.mock("../../../../../utils/getReadableProfile", () => ({
  getReadableProfile: (address: string) => {
    if (address === "0xGroupMember1") return "Group Member";
    if (address === "0xCurrentUserAddress") return "Current User";
    return address;
  },
}));

// ... rest of the existing code ...
```

The fix involves replacing all `@/` alias paths in the mock statements with relative paths (`../../../../../`). This ensures Jest can properly resolve the module paths during testing. The rest of the test file remains unchanged.

Note: If you want to keep using the `@/` alias in tests, you'll need to configure Jest's `moduleNameMapper` in your Jest configuration file. However, using relative paths is a simpler solution for this specific case.

---

_**User**_

wtf no it works with others using @

---

_**Assistant**_

I apologize for my previous response - you're right. If the `@/` alias is working with other imports, we should keep using it. The issue might be with the specific path to the conversations query.

Let's check the correct path for the conversations query. Could you verify if the path should be:

```typescript:features/conversation/conversation-create/search-by-conversation-membership/utils/search-by-conversation-membership.test.ts
// ... existing code ...

jest.mock("@/features/conversation/conversation.queries", () => ({
  getConversationsQueryData: jest.fn(),
}));

// ... rest of the existing code ...
```

Or if you could share the correct location of the `use-conversations-query` file, I can provide the exact path that should be used. The error suggests that the current import path isn't correct, but maintaining the `@/` alias pattern is definitely the right approach.

---



---

