## SpecStory

## Switching to useColorScheme for Theme (1/13/2025, 2:51:22 PM)

_**User**_

don't use navTheme just use useColorScheme instead to detemrine if we are light or dark mode

---

_**Assistant**_

I'll help modify the code to use `useColorScheme` instead of `navTheme`. Here are the key changes needed:

```typescript:theme/useAppTheme.ts
// Remove this import
import {
  DarkTheme,
  DefaultTheme,
  useTheme as useNavTheme, // Remove this
} from "@react-navigation/native";

// ... existing imports ...

type UseAppThemeValue = {
  // Remove navTheme from return type
  setThemeContextOverride: (newTheme: ThemeContexts) => void;
  theme: Theme;
  themeContext: ThemeContexts;
  themed: <T>(
    styleOrStyleFn: ThemedStyle<T> | StyleProp<T> | ThemedStyleArray<T>
  ) => T;
  toggleTheme: () => void;
};

export const useAppTheme = (): UseAppThemeValue => {
  // Remove navTheme and use useColorScheme instead
  const colorScheme = useColorScheme();
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  const { themeScheme: overrideTheme, setThemeContextOverride } = context;

  const themeContext: ThemeContexts = useMemo(
    () => overrideTheme || (colorScheme === 'dark' ? "dark" : "light"),
    [overrideTheme, colorScheme]
  );

  // ... rest of the code remains the same ...

  // Update the debug logging
  useEffect(() => {
    if (!__DEV__) {
      logger.debug("=== Theme Debug ===", {
        systemColorScheme: Appearance.getColorScheme(),
        platformVersion: Platform.Version,
        themeContext: themeContext,
        isDarkTheme: themeVariant.isDark,
      });
    }
  }, [themeContext, themeVariant]);

  return {
    setThemeContextOverride,
    theme: themeVariant,
    themeContext,
    themed,
    toggleTheme,
  };
};
```

The main changes are:
1. Removed the react-navigation theme imports and usage
2. Replaced `navTheme` with `useColorScheme()` for determining the system theme
3. Removed `navTheme` from the return type and return value
4. Updated the debug logging to remove the `navThemeDark` property
5. Simplified the theme context determination to use `colorScheme` directly

The rest of the theming logic remains the same, we're just using the system's color scheme directly instead of going through React Navigation's theme.

---



---

