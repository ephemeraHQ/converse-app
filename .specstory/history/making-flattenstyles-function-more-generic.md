## SpecStory

## Making FlattenStyles Function More Generic (11/14/2024, 3:02:56 PM)

_**User**_

make it generic like it's not only ViewStyle... maybe use StyleProp?

---

_**Assistant**_

I'll help you make the `flattenStyles` function more generic using `StyleProp` from React Native. This will allow it to work with any style type (ViewStyle, TextStyle, ImageStyle).

```typescript:utils/styles.ts
import { StyleSheet, StyleProp } from "react-native";

export function flattenStyles<T>(styles: StyleProp<T>) {
  return StyleSheet.flatten(styles);
}
```

The changes:
1. Imported `StyleProp` instead of `ViewStyle`
2. Made the function generic with type parameter `T`
3. Changed the parameter type to `StyleProp<T>` which can handle arrays, objects, or nested style props of any valid style type

Now you can use this function with any style type:
```typescript
// Examples of usage:
flattenStyles<ViewStyle>(viewStyles);
flattenStyles<TextStyle>(textStyles);
flattenStyles<ImageStyle>(imageStyles);
```

---



---

