## SpecStory

## Indicating Function Errors in TypeScript (1/13/2025, 1:39:21 PM)

_**User**_

How can i tell the callers that this will throw if we can't find the DM?

---

_**Assistant**_

Based on the TypeScript style guide, we should update the function's return type to clearly indicate it can throw. Here's how to modify the function signature:

```typescript:utils/xmtpRN/conversations.ts
async function findDm(args: {
  client: ConverseXmtpClientType;
  peer: string;
  includeSync?: boolean;
}): Promise<DmWithCodecsType | never> {
  // ... existing code ...
}
```

The `never` type in the return signature indicates to TypeScript that this function might not return at all (i.e., it might throw). While TypeScript doesn't enforce checked exceptions like Java, this return type signature helps document that this function can throw.

You might also want to add a JSDoc comment to make it even more explicit:

```typescript:utils/xmtpRN/conversations.ts
/**
 * Finds a DM conversation with a peer
 * @throws {Error} When DM with the specified peer is not found
 */
async function findDm(args: {
  client: ConverseXmtpClientType;
  peer: string;
  includeSync?: boolean;
}): Promise<DmWithCodecsType | never> {
  // ... existing code ...
}
```

---



---

