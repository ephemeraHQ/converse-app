## SpecStory

## Type Error Resolution for Icon Component (10/16/2024, 11:16:16 AM)

_**User**_

For the code present, we get this error:
```
Type '(props: { size: number; color: string; }) => string | number | boolean | Iterable<ReactNode> | JSX.Element | ImageURISource | ImageURISource[] | Readonly<...> | null | undefined' is not assignable to type 'IconSource'.
  Type '(props: { size: number; color: string; }) => string | number | boolean | Iterable<ReactNode> | JSX.Element | ImageURISource | ImageURISource[] | Readonly<...> | null | undefined' is not assignable to type '(props: IconProps & { color: string; }) => ReactNode'.
    Type 'string | number | boolean | Iterable<ReactNode> | Element | ImageURISource | ImageURISource[] | Readonly<{ source: IconSourceBase; direction: "auto" | ... 1 more ... | "rtl"; }> | null | undefined' is not assignable to type 'ReactNode'.
      Type 'ImageURISource' is not assignable to type 'ReactNode'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

To resolve this error, we need to adjust the type of `renderIcon` to match the expected `IconSource` type from react-native-paper. Here's a concise fix:

```typescript:design-system/IconButton.tsx
// ... existing imports ...
import { IconProps } from "react-native-paper/lib/typescript/components/MaterialCommunityIcon";

// ... existing code ...

export const IconButton = memo(function IconButton({
  iconName,
  icon,
  ...rest
}: IconButtonProps) {
  const renderIcon = useCallback(
    (props: IconProps) => {
      if (icon) {
        return typeof icon === "function" ? icon(props) : icon;
      }

      if (iconName) {
        return <Picto picto={iconName} color={props.color} size={props.size} />;
      }

      return null;
    },
    [icon, iconName]
  );

  return <RNPIconButton icon={renderIcon} {...rest} />;
});
```

The main changes are:

1. Import `IconProps` from react-native-paper.
2. Remove the explicit type annotation for `renderIcon`.
3. Change the props type in the callback to `IconProps`.

These changes should resolve the type mismatch and make the `renderIcon` function compatible with the expected `IconSource` type.

---



---

