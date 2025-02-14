## SpecStory

## Type Error Resolution for Icon Component (10/16/2024, 11:07:35 AM)

_**User**_

For the code present, we get this error:
```
Type '(props: { size: number; color: string; }) => JSX.Element | RNPIconSource | null' is not assignable to type 'IconSource'.
  Type '(props: { size: number; color: string; }) => JSX.Element | RNPIconSource | null' is not assignable to type '(props: IconProps & { color: string; }) => ReactNode'.
    Type 'Element | IconSource | null' is not assignable to type 'ReactNode'.
      Type 'ImageURISource' is not assignable to type 'ReactNode'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

To resolve this error, we need to adjust the type of `renderIcon` to match the expected `IconSource` type from react-native-paper. Here's a concise fix:

```typescript:design-system/IconButton.tsx
// ... existing imports ...
import { IconProps } from "react-native-vector-icons/Icon";

// ... existing code ...

  const renderIcon = useCallback((props: IconProps) => {
    if (icon) {
      return icon(props);
    }

    if (iconName) {
      return <Picto picto={iconName} color={props.color} size={props.size} />;
    }

    return null;
  }, [icon, iconName]);

  return <RNPIconButton icon={renderIcon} {...rest} />;
```

This fix makes the following changes:

1. Removed the explicit type annotation for `renderIcon`.
2. Changed the props type to `IconProps` from react-native-vector-icons.
3. Updated the `icon` handling to call it as a function with `props`.

These changes should resolve the type mismatch and make the `renderIcon` function compatible with the expected `IconSource` type.

---



---

