## SpecStory

## React Native Cursor Color Issue (2/4/2025, 3:35:37 PM)

_**User**_

cursor color doens'T work is it normal?

---

_**Assistant**_

The `cursorColor` prop might not work on iOS devices because it's an Android-specific prop in React Native. To handle cursor color across both platforms, we should use `selectionColor` which works on both iOS and Android.

Here's how to update the TextInput component:

```typescript:design-system/text-input.tsx
// ... existing code ...
    const { style, cursorColor = theme.colors.text.primary, ...rest } = props;

    return (
      <RNTextInput
        cursorColor={cursorColor} // Android
        selectionColor={cursorColor} // iOS and Android
        style={[themed(textPresets["body"]), style]}
        {...rest}
        ref={ref}
      />
    );
// ... existing code ...
```

I added `selectionColor` prop which will:
1. Control the cursor color on iOS
2. Control both the cursor and text selection color on Android

This should now work consistently across both platforms. Note that on iOS, this will also affect the text selection color, which is the expected behavior on that platform.

---

_**User**_

For the code present, we get this error:
```
No overload matches this call.
  Overload 1 of 2, '(props: TextInputProps): TextInput', gave the following error.
    Type 'ColorValue | null' is not assignable to type 'ColorValue | undefined'.
      Type 'null' is not assignable to type 'ColorValue | undefined'.
  Overload 2 of 2, '(props: TextInputProps, context: any): TextInput', gave the following error.
    Type 'ColorValue | null' is not assignable to type 'ColorValue | undefined'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error occurs because `selectionColor` doesn't accept `null` as a value. Let's add a type assertion to handle this:

```typescript:design-system/text-input.tsx
// ... existing code ...
        selectionHandleColor={cursorColor as string}
        selectionColor={cursorColor as string}
        style={[themed(textPresets["body"]), style]}
// ... existing code ...
```

This type assertion tells TypeScript that `cursorColor` will be a string, resolving the type mismatch with `ColorValue`.

---



---

