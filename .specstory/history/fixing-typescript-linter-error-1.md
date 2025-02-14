## SpecStory

## Fixing TypeScript Linter Error (2/18/2025, 11:06:07 AM)

_**User**_

clean

---

_**Assistant**_

I'll help fix the linter error related to the undefined `IProfileSocialsZodSchema` type. We need to import this type from the appropriate location.

```typescript:features/conversation-list/hooks/use-message-plain-text.ts
// ... existing imports ...
import { IProfileSocialsZodSchema } from "@/features/social-profiles/social-lookup.types";

// ... rest of the existing code remains unchanged ...
```

This change adds the missing import for the `IProfileSocialsZodSchema` type that's being used in the type assertion on line 77. The rest of the file can remain unchanged since the type is only needed for the type assertion.

Make sure the type exists in the specified path. If it doesn't, you may need to create it or import it from a different location where it's actually defined.

---



---

