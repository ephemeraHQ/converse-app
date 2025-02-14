## SpecStory

## Understanding TypeScript Branded Types (11/14/2024, 10:16:16 AM)

_**User**_

why "& { readonly brand: unique symbol }" 

---

_**Assistant**_

This is a TypeScript technique called "nominal typing" or "branded types". It's a way to create type-safe distinctions between strings that might otherwise be structurally identical.

Here's a breakdown of why it's useful:

1. Without the brand:
```typescript
type InboxId = string;

// This would be valid, but potentially unsafe:
const randomString: InboxId = "not-a-real-inbox-id";
```

2. With the brand:
```typescript
type InboxId = string & { readonly brand: unique symbol };

// This won't compile:
const randomString: InboxId = "not-a-real-inbox-id"; // Error!

// You need to properly create an InboxId through the intended API
const validInboxId = await Client.getOrCreateInboxId(address);
```

Benefits:
- Prevents accidental assignments of regular strings to InboxId variables
- Makes the type system treat InboxId as a distinct type from string
- Ensures InboxId can only be created through proper channels (like the Client API)
- Zero runtime overhead (the brand is only used by TypeScript for type checking)

This pattern is commonly used when you want to ensure type safety for identifiers, ensuring they can't be confused with regular strings or other similar types. Other examples might include:

```typescript
type UserId = string & { readonly brand: unique symbol };
type ApiKey = string & { readonly brand: unique symbol };
```

Each of these would be incompatible with regular strings and with each other, despite all being string-based underneath.

---



---

