## SpecStory

## Integrating Keyboard Controller in React Native Setup (10/2/2024, 1:24:18 PM)

_**User**_

How would I integrate react-native-keyboard-controller with the current setup i have in screen here where Im using KeyboardAvoidingView 

---

_**Assistant**_

To integrate `react-native-keyboard-controller` with your current `Screen` component setup, we'll need to make some modifications. The `react-native-keyboard-controller` package provides a more performant and flexible way to handle keyboard interactions compared to `KeyboardAvoidingView`.

Here's how we can update the `Screen` component to use `react-native-keyboard-controller`:

1. First, install the package if you haven't already:
   ```
   npm install react-native-keyboard-controller
   ```

2. Now, let's modify the `Screen` component. We'll replace `KeyboardAvoidingView` with `KeyboardControllerView` from `react-native-keyboard-controller`.

Here's the updated `Screen` component:

```typescript:components/Screen/Screen.tsx
import { KeyboardControllerView } from 'react-native-keyboard-controller';
// ... other imports remain the same

// Update the ScreenProps interface
interface BaseScreenProps {
  // ... existing props
  KeyboardControllerViewProps?: React.ComponentProps<typeof KeyboardControllerView>;
}

// ... other interfaces and types remain the same

export function Screen(props: ScreenProps) {
  const {
    backgroundColor = colors.background,
    KeyboardControllerViewProps,
    safeAreaEdges,
    StatusBarProps,
    statusBarStyle = "dark",
  } = props;

  const $containerInsets = useSafeAreaInsetsStyle(safeAreaEdges);

  return (
    <View style={[$containerStyle, { backgroundColor }, $containerInsets]}>
      <StatusBar style={statusBarStyle} {...StatusBarProps} />

      <KeyboardControllerView
        style={$keyboardControllerViewStyle}
        {...KeyboardControllerViewProps}
      >
        {isNonScrolling(props.preset) ? (
          <ScreenWithoutScrolling {...props} />
        ) : (
          <ScreenWithScrolling {...props} />
        )}
      </KeyboardControllerView>
    </View>
  );
}

// ... rest of the file remains the same

const $keyboardControllerViewStyle: ViewStyle = {
  flex: 1,
};
```

This modification replaces `KeyboardAvoidingView` with `KeyboardControllerView`. The `KeyboardControllerView` component from `react-native-keyboard-controller` automatically handles keyboard avoidance, so we don't need to specify behaviors or offsets like we did with `KeyboardAvoidingView`.

3. Update the `App.tsx` file to wrap your app with `KeyboardProvider`:

```typescript:App.tsx
import { KeyboardProvider } from 'react-native-keyboard-controller';

function App() {
  return (
    <KeyboardProvider statusBarTranslucent>
      {/* Your app content */}
    </KeyboardProvider>
  );
}

export default App;
```

These changes will integrate `react-native-keyboard-controller` into your current setup. The `KeyboardControllerView` in the `Screen` component will handle keyboard interactions more efficiently, and you can still customize its behavior using the `KeyboardControllerViewProps` if needed.

Remember to test thoroughly on both iOS and Android to ensure the keyboard behavior meets your requirements across different devices and screen sizes.

---



---

