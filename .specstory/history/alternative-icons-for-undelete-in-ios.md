## SpecStory

## Alternative Icons for Undelete in iOS (1/17/2025, 10:45:51 AM)

_**User**_

what other icon i could use to undelete ? look at iosSmybols

---

_**Assistant**_

For an undelete/restore action in iOS, there are several appropriate SF Symbols (iOS system icons) you could use instead of "undo". Here are some good alternatives:

1. `arrow.uturn.backward` - Similar to undo but more modern looking
2. `arrow.counterclockwise` - A circular arrow that suggests restoration
3. `tray.and.arrow.up` - Represents bringing something back from a tray/storage
4. `archivebox.circle.fill` - If the deletion was more like archiving
5. `arrow.triangle.2.circlepath` - Represents a restore/reset action

The most semantically appropriate ones would be either `arrow.uturn.backward` or `arrow.counterclockwise` as they're commonly used in iOS for undo/restore actions.

Here's how you could update the code:

```typescript:features/conversation-list/conversation-list-item/conversation-list-item-swipeable/conversation-list-item-swipeable-restore-action.tsx
// ... existing code ...
        icon="arrow.counterclockwise"
// ... existing code ...
```

This icon is more aligned with iOS design guidelines and clearly communicates the restore action to users.

---



---

