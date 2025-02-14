## SpecStory

## Fixing Linter Error in TypeScript (2/18/2025, 11:08:15 AM)

_**User**_

clean

---

_**Assistant**_

I'll help fix the linter error by importing the missing `IProfileSocialsZodSchema` type. Based on the code context, this type should be imported from a profile-related types file.

```typescript:features/conversation-list/hooks/use-message-plain-text.ts
// ... existing imports ...
import { IProfileSocialsZodSchema } from "@/features/profile/profile.types";

// ... rest of the existing code ...
```

This should resolve the linter error on line 77 where `IProfileSocialsZodSchema` is used but wasn't imported. The rest of the file can remain unchanged since the type usage is correct, it just needed to be imported.

---



---

