## SpecStory

## iOS Style Header Configuration in React Navigation (1/8/2025, 6:46:25 AM)

_**User**_

Make header like ios Settings with large title  following what's here@https://reactnavigation.org/docs/headers/ 

---

_**Assistant**_

Based on the React Navigation documentation and iOS Settings style, I'll help you configure the header with a large title. Here's how to modify your navigation configuration:

```typescript:screens/Navigation/ConversationRequestsListNav.ios.tsx
// ... existing imports ...

const navigationOptions = {
  headerLargeTitle: true,
  headerLargeStyle: {
    backgroundColor: theme.colors.background,
  },
  headerStyle: {
    backgroundColor: theme.colors.background,
  },
  headerLargeTitleStyle: {
    fontWeight: 'bold',
  },
  headerShadowVisible: false,
} satisfies NativeStackNavigationOptions;

// ... in your component ...
<NativeStack.Screen 
  name="ChatsRequests" 
  options={{
    ...navigationOptions,
    title: "Chat Requests", // Or whatever title you want to display
  }}
/>
```

Key changes explained:
- Added `headerLargeTitle: true` to enable iOS-style large titles
- Set background colors using theme
- Added `headerLargeTitleStyle` for the large title customization
- Disabled header shadow with `headerShadowVisible: false` for a cleaner look
- Used the theme system as per style guide

Make sure you have `const { theme } = useAppTheme();` imported at the top of your file.

This will give you a header that collapses/expands on scroll, similar to the iOS Settings app. The large title will appear when scrolled to the top and shrink into a normal header when scrolling down.

---



---

