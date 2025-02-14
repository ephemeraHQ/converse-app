## SpecStory

## Fixing Invalid Regex Flags Error (11/14/2024, 10:40:55 AM)

_**User**_

I get error here like "invalid flags"?

---

_**Assistant**_

The issue is that you're appending "g" flag to existing flags without checking if "g" is already present. This can lead to invalid flag combinations. Here's how to fix it:

```typescript:components/ParsedText/ParsedText.utils.ts
// ... existing code ...
          const regex = new RegExp(
            pattern.pattern.source,
            pattern.pattern.flags.includes('g') ? pattern.pattern.flags : pattern.pattern.flags + 'g'
          );
// ... existing code ...
```

This change:
1. Checks if 'g' flag is already present in pattern.pattern.flags
2. If it is, uses the flags as-is
3. If it's not, appends 'g' to the existing flags

This prevents duplicate flags which would cause the "invalid flags" error. For example, if the original pattern already had flags 'gi', adding another 'g' would result in 'gig' which is invalid.

---



---

