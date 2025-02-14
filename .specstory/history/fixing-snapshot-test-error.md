## SpecStory

## Fixing Snapshot Test Error (1/14/2025, 8:07:04 PM)

_**User**_

fix this test error:

 {
        "CONVERSATION": "conversation",
        "CONVERSATIONS": "conversations",
    +   "CONVERSATION_DATA": "conversationData",
        "CONVERSATION_DM": "conversationDM",
        "CONVERSATION_MESSAGE": "conversationMessage",
        "CONVERSATION_MESSAGES": "conversationMessages",
        "GROUP_CREATOR": "groupCreator",
        "GROUP_INVITE": "groupInvite",

      21 | describe("QueryKeys", () => {
      22 |   it("should match the snapshot", () => {
    > 23 |     expect(QueryKeys).toMatchSnapshot();
         |                       ^
      24 |   });
      25 | });
      26 |

      at Object.toMatchSnapshot (queries/Que

---

_**Assistant**_

The test error suggests that the snapshot doesn't match because there's a new enum value `CONVERSATION_DATA` that needs to be added to the test's snapshot. However, looking at your code, `CONVERSATION_DATA` is already defined in the `QueryKeys` enum.

The solution is to update the snapshot by running the test with the snapshot update flag. You can do this by running:

```bash
jest -u
# or
npm test -- -u
# or
yarn test -u
```

This will update the snapshot to include the new `CONVERSATION_DATA` enum value. The error occurred because the snapshot was created before `CONVERSATION_DATA` was added to the enum, and snapshots need to be explicitly updated when we make intentional changes to the code.

No code changes are needed in your `QueryKeys.ts` file since the enum is already correctly defined. The test just needs its snapshot updated to match the current state of the code.

---



---

