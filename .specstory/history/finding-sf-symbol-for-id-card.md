## SpecStory

## Finding SF Symbol for ID Card (1/10/2025, 9:31:43 AM)

_**User**_

is htere a ios SF symbol ot reprensent like a card id

---

_**Assistant**_

Yes, there are a few SF Symbols that could represent an ID card. The most relevant ones are:

1. `person.text.rectangle` - represents a card with a person and text (most ID card-like)
2. `creditcard` - more generic card representation

I'd recommend adding `person.text.rectangle` to your `IIconName` type. Here's how to add it:

```typescript:design-system/Icon/Icon.types.ts
export type IIconName =
  | "xmark"
  // ... existing icons ...
  | "shield"
  | "shield.fill"
  | "person.text.rectangle";  // Add this new icon
```

This SF Symbol (`person.text.rectangle`) is available in iOS 15.0 and later, and it's specifically designed to represent identification cards or badges.

---



---

