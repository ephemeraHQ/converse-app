## SpecStory

## Fixing TypeScript Property Access Error (2/19/2025, 8:13:57 AM)

_**User**_

For the code present, we get this error:
```
Property 'name' does not exist on type '{ bio?: string | undefined; fid?: number | undefined; pfp?: string | undefined; display?: string | undefined; username?: string | undefined; custodyAddress?: string | undefined; addresses?: string[] | undefined; } | { ...; } | { ...; }'.
  Property 'name' does not exist on type '{ bio?: string | undefined; fid?: number | undefined; pfp?: string | undefined; display?: string | undefined; username?: string | undefined; custodyAddress?: string | undefined; addresses?: string[] | undefined; }'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error suggests that the metadata types for different social profiles (ENS, Lens, Farcaster) have different structures. Let's fix this by properly type checking each profile's metadata.

```typescript:features/profiles/utils/does-socials-match-text-query.ts
// ... existing code ...

      // Check ENS metadata
      profile.type === "ens" &&
        profile.metadata &&
        "name" in profile.metadata &&
        profile.metadata.name?.toLowerCase().includes(normalizedQuery),

      // Check Lens metadata
      profile.type === "lens" &&
        profile.metadata &&
        "name" in profile.metadata &&
        profile.metadata.name?.toLowerCase().includes(normalizedQuery),

      // Check Farcaster metadata
      profile.type === "farcaster" &&
        profile.metadata && (
          ("username" in profile.metadata &&
            profile.metadata.username?.toLowerCase().includes(normalizedQuery)) ||
          ("display" in profile.metadata &&
            profile.metadata.display?.toLowerCase().includes(normalizedQuery))
        ),
// ... existing code ...
```

The key changes:
1. Use type guards with `in` operator to check if properties exist
2. Simplified the structure to avoid object literals
3. Combined Farcaster checks into a single condition

---



---

