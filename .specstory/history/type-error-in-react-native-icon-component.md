## SpecStory

## Type Error in React Native Icon Component (10/16/2024, 11:15:16 AM)

_**User**_

For the code present, we get this error:
```
Type '(props: { size: number; color: string; }) => JSX.Element | IconSource | null' is not assignable to type 'IconSource'.
  Type '(props: { size: number; color: string; }) => JSX.Element | IconSource | null' is not assignable to type '(props: IconProps & { color: string; }) => ReactNode'.
    Type 'Element | IconSource | null' is not assignable to type 'ReactNode'.
      Type 'ImageURISource' is not assignable to type 'ReactNode'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

To resolve this error, we need to adjust the type of the `icon` prop in the `RNPIconButton` component. The error suggests that the `IconSource` type is more specific than what our `renderIcon` function returns. Let's modify the `renderIcon` function to ensure it always returns a valid `IconSource`.

Here's a concise fix:

```typescript:design-system/IconButton.tsx
import { memo, useCallback } from "react";
import {
  IconButtonProps as IRNPIconButtonProps,
  IconButton as RNPIconButton,
  IconSource,
} from "react-native-paper";
import Picto from "../components/Picto/Picto";

type IconButtonProps = IRNPIconButtonProps & {
  iconName?: string;
};

export const IconButton = memo(function IconButton({
  iconName,
  icon,
  ...rest
}: IconButtonProps) {
  const renderIcon: IconSource = useCallback(
    (props) => {
      if (icon) {
        return typeof icon === 'function' ? icon(props) : icon;
      }

      if (iconName) {
        return <Picto picto={iconName} color={props.color} size={props.size} />;
      }

      return () => null;
    },
    [icon, iconName]
  );

  return <RNPIconButton icon={renderIcon} {...rest} />;
});
```

Key changes:

1. Imported `IconSource` from 'react-native-paper'.
2. Explicitly typed `renderIcon` as `IconSource`.
3. Adjusted the `renderIcon` function to handle cases where `icon` is a function or a direct value.
4. Changed the default return to `() => null` to match the expected `IconSource` type.

These changes should resolve the type error while maintaining the component's functionality.

---



---

