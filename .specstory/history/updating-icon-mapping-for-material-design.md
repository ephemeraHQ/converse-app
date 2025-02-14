## SpecStory

## Updating Icon Mapping for Material Design (1/17/2025, 10:59:18 AM)

_**User**_

find one in material

---

_**Assistant**_

Looking at the code, I notice that the `restore` icon is mapped to "archivebox.circle.fill" which appears to be an iOS-style icon name rather than a Material Icons name. Since this is the Android implementation, we should use the correct Material Icons name. Material Icons has a "restore" icon that would be more appropriate here.

Here's the edit needed:

```typescript:design-system/Icon/Icon.android.tsx
// ... existing code ...
  settings: "settings",
  restore: "restore",
};
// ... existing code ...
```

This change maps the `restore` icon name to Material Icons' native "restore" icon, which is more appropriate for Android and matches the Material Design system. The "restore" icon in Material Icons typically shows a counterclockwise arrow, which is commonly used to represent restoration or reverting actions.

---



---

