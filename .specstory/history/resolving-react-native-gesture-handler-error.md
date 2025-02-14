## SpecStory

## Resolving React Native Gesture Handler Error (11/13/2024, 11:10:08 AM)

_**User**_

For the code present, we get this error:
```
Cannot find module 'react-native-gesture-handler/ReanimatedSwipeable' or its corresponding type declarations.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The import path for Swipeable from react-native-gesture-handler has changed. Here's the fix:

```typescript:components/Chat/Message/SwipeableMessageWrapper.tsx
// ... existing imports ...
import { Swipeable } from "react-native-gesture-handler";
// ... rest of the code ...
```

The Swipeable component is now directly exported from `react-native-gesture-handler` instead of a separate path. Make sure you have `react-native-gesture-handler` installed in your project via npm or yarn.

---

_**User**_

but look here it says @https://docs.swmansion.com/react-native-gesture-handler/docs/components/reanimated_swipeable 

import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

---

_**Assistant**_

Based on the documentation, there are two different Swipeable components available. Let's use the Reanimated version since that's what the import path in the docs suggests:

```typescript:components/Chat/Message/SwipeableMessageWrapper.tsx
// ... existing imports ...
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
// ... rest of the code ...
```

Also make sure to update the type reference from `Swipeable` to `ReanimatedSwipeable` in your `useRef`:

```typescript:components/Chat/Message/SwipeableMessageWrapper.tsx
const swipeableRef = useRef<ReanimatedSwipeable>(null);
```

The Reanimated version provides better performance as it's built with Reanimated 2. Make sure you have both `react-native-gesture-handler` and `react-native-reanimated` installed in your project.

[Source](https://docs.swmansion.com/react-native-gesture-handler/docs/components/reanimated_swipeable)

---



---

