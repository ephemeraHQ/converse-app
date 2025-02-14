## SpecStory

## TypeScript Autocomplete for setOptions Issue (1/3/2025, 2:58:34 PM)

_**User**_

why does setOptions doesnt have typescript autocomplete for properties

---

_**Assistant**_

The issue is that `navigation.setOptions()` isn't getting proper TypeScript type inference because the navigation prop isn't properly typed. In React Navigation, we need to properly type the navigation prop to get autocomplete for the navigation options.

Here's how to fix it:

```typescript:screens/ConversationList.tsx
// ... existing imports ...
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Add this type
type IConversationListScreenNavigationProp = NativeStackNavigationProp<
  NavigationParamList,
  'Chats' | 'ShareFrame' | 'Blocked'
>;

function useHeader() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<IConversationListScreenNavigationProp>();
  // ... rest of the code ...

  useLayoutEffect(() => {
    navigation.setOptions({
      // Now you should get proper TypeScript autocomplete here
    });
  }, [/* ... */]);
}
```

The key changes are:

1. Import `NativeStackNavigationProp` from '@react-navigation/native-stack'
2. Create a specific navigation prop type using your existing `NavigationParamList`
3. Type the `useNavigation` hook with this specific navigation prop type

This will give you proper TypeScript autocomplete for all available navigation options specific to NativeStackNavigator.

---



---

