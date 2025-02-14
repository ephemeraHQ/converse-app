## SpecStory

## Profile Screen Modal Navigation Setup (10/2/2024, 11:02:46 AM)

_**User**_

with react navigation v6 how can i add a back button for when presentation modal

---

_**Assistant**_

To add a back button for a modal presentation in React Navigation v6, you can modify the `headerLeft` option in your screen configuration. Here's how you can update your `ProfileNav` component to include a back button:

```typescript:screens/Navigation/ProfileNav.tsx
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
// ... other imports

export default function ProfileNav() {
  const colorScheme = useColorScheme();
  const account = useCurrentAccount();
  // ... other code

  return (
    <NativeStack.Screen
      name="Profile"
      component={ProfileScreen}
      options={({ navigation, route }) => ({
        presentation: "modal",
        headerBackTitle: "Back",
        headerTitle: "Profile",
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Picto
              picto="xmark"
              size={PictoSizes.navItem}
              color={textSecondaryColor(colorScheme)}
              style={{ marginLeft: Platform.OS === "web" ? 30 : 0 }}
            />
          </TouchableOpacity>
        ),
        headerRight: () => {
          // ... existing headerRight code
        },
        ...options,
      })}
    />
  );
}
```

Here's what changed:

1. We added a `headerLeft` option to the screen configuration.
2. The `headerLeft` function returns a `TouchableOpacity` component with a `Picto` icon (assuming "xmark" is an appropriate icon for closing).
3. The `onPress` handler for the `TouchableOpacity` calls `navigation.goBack()` to dismiss the modal.
4. We added `navigation` to the destructured parameters in the options function.

This modification will add a back button (in the form of an "X" icon) to the left side of the header when the Profile screen is presented as a modal. When pressed, it will dismiss the modal and return to the previous screen.

Remember to adjust the `picto` prop of the `Picto` component if you want to use a different icon for the back button. Also, you might want to adjust the styling (like `marginLeft`) based on your specific design requirements.

---

_**User**_

can you look online and see if you find any library ? I want to make sure i use the same kind of style like react-navigation you know

---

_**Assistant**_

Certainly! After researching, I found that React Navigation actually provides a built-in component for this purpose. It's called `HeaderBackButton` and it's specifically designed to work well with React Navigation's header styling.

Here's how you can modify your code to use this official component:

```typescript:screens/Navigation/ProfileNav.tsx
import { HeaderBackButton } from '@react-navigation/elements';
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
// ... other imports

export default function ProfileNav() {
  const colorScheme = useColorScheme();
  const account = useCurrentAccount();
  // ... other code

  return (
    <NativeStack.Screen
      name="Profile"
      component={ProfileScreen}
      options={({ navigation, route }) => ({
        presentation: "modal",
        headerBackTitle: "Back",
        headerTitle: "Profile",
        headerLeft: (props) => (
          <HeaderBackButton
            {...props}
            onPress={() => navigation.goBack()}
            label="Back"
            tintColor={textSecondaryColor(colorScheme)}
          />
        ),
        headerRight: () => {
          // ... existing headerRight code
        },
        ...options,
      })}
    />
  );
}
```

Here's what changed:

1. We import `HeaderBackButton` from '@react-navigation/elements'.
2. We use `HeaderBackButton` in the `headerLeft` option.
3. We spread the `props` received by the `headerLeft` function into `HeaderBackButton` to ensure we're passing through any default props.
4. We set the `onPress` handler to call `navigation.goBack()`.
5. We set a `label` prop to "Back" (you can customize this or remove it for just an icon).
6. We use `tintColor` to set the color of the button, using your existing `textSecondaryColor` function.

This approach has several advantages:

1. It uses React Navigation's built-in component, ensuring consistency with the rest of the navigation UI.
2. It automatically handles different platforms (iOS vs Android) with appropriate styling.
3. It's accessible and follows React Navigation's best practices.

Remember to adjust the `label` and `tintColor` as needed to fit your app's design. This solution should provide a back button that looks and feels native to both iOS and Android while integrating seamlessly with your existing React Navigation setup.

---

_**User**_

possible to just not show icon? is there a setting for that or I really need to do headerLeft: (props) => (
          <HeaderBackButton
            {...props}
            onPress={() => navigation.goBack()}
            label="Back"
            tintColor={textSecondaryColor(colorScheme)}
          />
        ),

---

_**Assistant**_

Yes, it's possible to show just the text without an icon using the `HeaderBackButton` component. You can use the `backImage` prop to control this. Here's how you can modify the code to show only the text:

```typescript:screens/Navigation/ProfileNav.tsx
import { HeaderBackButton } from '@react-navigation/elements';
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
// ... other imports

export default function ProfileNav() {
  const colorScheme = useColorScheme();
  const account = useCurrentAccount();
  // ... other code

  return (
    <NativeStack.Screen
      name="Profile"
      component={ProfileScreen}
      options={({ navigation }) => ({
        presentation: "modal",
        headerBackTitle: "Back",
        headerTitle: "Profile",
        headerLeft: () => (
          <HeaderBackButton
            onPress={() => navigation.goBack()}
            label="Back"
            labelVisible={true}
            backImage={() => null}
            labelStyle={{ color: textSecondaryColor(colorScheme) }}
          />
        ),
        headerRight: () => {
          // ... existing headerRight code
        },
        ...options,
      })}
    />
  );
}
```

Here's what changed:

1. We set `backImage={() => null}` to remove the icon.
2. We set `labelVisible={true}` to ensure the label is shown.
3. We use `labelStyle` to set the color of the text, instead of `tintColor`.
4. We removed the `{...props}` spread as we're customizing most of the props anyway.

This configuration will show only the "Back" text without any icon. The text will be clickable and will navigate back when pressed.

If you want to further customize the appearance or behavior, you can adjust the `labelStyle` prop or add other props as needed. For example, you could add padding or change the font size:

```typescript
labelStyle={{ 
  color: textSecondaryColor(colorScheme),
  fontSize: 16,
  paddingHorizontal: 10,
}}
```

This approach gives you the benefit of using React Navigation's built-in component while still achieving the specific look you want.

---



---

