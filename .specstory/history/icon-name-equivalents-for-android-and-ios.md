## SpecStory

## Icon Name Equivalents for Android and iOS (1/3/2025, 11:22:44 AM)

_**User**_

what is the equivalent for android system icon?

---

_**Assistant**_

For Android, you'll want to use Material Icons naming convention. The equivalent of "gearshape" would be "settings". Here's how you can make it work cross-platform:

```typescript:screens/ConversationList.tsx
// ... existing code ...
                            iconValue: Platform.select({
                              ios: "gearshape",
                              android: "settings"
                            }),
// ... existing code ...
```

The Material Icons "settings" icon is the standard gear/cog icon used across Android applications for settings-related actions. This maintains platform consistency while achieving the same visual meaning on both platforms.

If you're using a custom icon system that needs to handle both platforms, you could also create a mapping helper function to standardize these platform-specific icon names across your app.

---



---

