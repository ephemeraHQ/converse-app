import {
  DarkTheme,
  DefaultTheme,
  useTheme as useNavTheme,
} from "@react-navigation/native";
import * as SystemUI from "expo-system-ui";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { StyleProp, useColorScheme } from "react-native";

import { colors, IColors } from "./colors";
import { colorsDark } from "./colorsDark";
import { ISpacing, spacing } from "./spacing";
import { Timing, timing } from "./timing";
import { ITypography, typography } from "./typography";

export type ThemeContexts = "light" | "dark" | undefined;

// The overall Theme object should contain all of the data you need to style your app.
export interface Theme {
  colors: IColors;
  spacing: ISpacing;
  typography: ITypography;
  timing: Timing;
  isDark: boolean;
}

// Here we define our themes.
export const lightTheme: Theme = {
  colors,
  spacing,
  typography,
  timing,
  isDark: false,
};
export const darkTheme: Theme = {
  colors: colorsDark,
  spacing,
  typography,
  timing,
  isDark: true,
};

/**
 * Represents a function that returns a styled component based on the provided theme.
 * @template T The type of the style.
 * @param theme The theme object.
 * @returns The styled component.
 *
 * @example
 * const $container: ThemedStyle<ViewStyle> = (theme) => ({
 *   flex: 1,
 *   backgroundColor: theme.colors.background,
 *   justifyContent: "center",
 *   alignItems: "center",
 * })
 * // Then use in a component like so:
 * const Component = () => {
 *   const { themed } = useAppTheme()
 *   return <View style={themed($container)} />
 * }
 */
export type ThemedStyle<T> = (theme: Theme) => T;
export type ThemedStyleArray<T> = (
  | ThemedStyle<T>
  | StyleProp<T>
  | (StyleProp<T> | ThemedStyle<T>)[]
)[];

type ThemeContextType = {
  themeScheme: ThemeContexts;
  setThemeContextOverride: (newTheme: ThemeContexts) => void;
};

// create a React context and provider for the current theme
export const ThemeContext = createContext<ThemeContextType>({
  themeScheme: undefined, // default to the system theme
  setThemeContextOverride: (_newTheme: ThemeContexts) => {
    console.error(
      "Tried to call setThemeContextOverride before the ThemeProvider was initialized"
    );
  },
});

const themeContextToTheme = (themeContext: ThemeContexts): Theme =>
  themeContext === "dark" ? darkTheme : lightTheme;

const setImperativeThemeing = (theme: Theme) => {
  SystemUI.setBackgroundColorAsync(theme.colors.background);
};

export const useThemeProvider = (initialTheme: ThemeContexts = undefined) => {
  const colorScheme = useColorScheme();
  const [overrideTheme, setTheme] = useState<ThemeContexts>(initialTheme);

  const setThemeContextOverride = useCallback((newTheme: ThemeContexts) => {
    setTheme(newTheme);
  }, []);

  const themeScheme = overrideTheme || colorScheme || "light";
  const navigationTheme = themeScheme === "dark" ? DarkTheme : DefaultTheme;

  useEffect(() => {
    setImperativeThemeing(themeContextToTheme(themeScheme));
  }, [themeScheme]);

  return {
    themeScheme,
    navigationTheme,
    setThemeContextOverride,
    ThemeProvider: ThemeContext.Provider,
  };
};

interface UseAppThemeValue {
  // The theme object from react-navigation
  navTheme: typeof DefaultTheme;
  // A function to set the theme context override (for switching modes)
  setThemeContextOverride: (newTheme: ThemeContexts) => void;
  // The current theme object
  theme: Theme;
  // The current theme context "light" | "dark"
  themeContext: ThemeContexts;
  // A function to apply the theme to a style object.
  // See examples in the components directory or read the docs here:
  // https://docs.infinite.red/ignite-cli/boilerplate/app/utils/
  themed: <T>(
    styleOrStyleFn: ThemedStyle<T> | StyleProp<T> | ThemedStyleArray<T>
  ) => T;
}

/**
 * Custom hook that provides the app theme and utility functions for theming.
 *
 * @returns {UseAppThemeReturn} An object containing various theming values and utilities.
 * @throws {Error} If used outside of a ThemeProvider.
 */
export const useAppTheme = (): UseAppThemeValue => {
  const navTheme = useNavTheme();
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  const { themeScheme: overrideTheme, setThemeContextOverride } = context;

  const themeContext: ThemeContexts = useMemo(
    () => overrideTheme || (navTheme.dark ? "dark" : "light"),
    [overrideTheme, navTheme]
  );

  const themeVariant: Theme = useMemo(
    () => themeContextToTheme(themeContext),
    [themeContext]
  );

  const themed = useCallback(
    <T>(
      styleOrStyleFn: ThemedStyle<T> | StyleProp<T> | ThemedStyleArray<T>
    ) => {
      const flatStyles = [styleOrStyleFn].flat(3);
      const stylesArray = flatStyles.map((f) => {
        if (typeof f === "function") {
          return (f as ThemedStyle<T>)(themeVariant);
        } else {
          return f;
        }
      });

      // Flatten the array of styles into a single object
      return Object.assign({}, ...stylesArray) as T;
    },
    [themeVariant]
  );

  return {
    navTheme,
    setThemeContextOverride,
    theme: themeVariant,
    themeContext,
    themed,
  };
};
