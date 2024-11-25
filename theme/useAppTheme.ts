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
import { Appearance, Platform, StyleProp, useColorScheme } from "react-native";

import { IShadow, shadow } from "@theme/shadow";

import { IAnimation, animation } from "@theme/animations";
import { ILayout, layout } from "@theme/layout";
import { IAvatarSize, avatarSize } from "./avatar";
import { IBorderRadius, borderRadius } from "./border-radius";
import { IBorderWidth, borderWidth } from "./borders";
import { colorsDark } from "./colorsDark";
import { IColors, colorsLight } from "./colorsLight";
import { IIconSize, iconSize } from "./icon";
import { ISpacing, spacing } from "./spacing";
import { Timing, timing } from "./timing";
import { ITypography, typography } from "./typography";

import logger from "@utils/logger";

export type ThemeContexts = "light" | "dark" | undefined;

// The overall Theme object should contain all of the data you need to style your app.
export type Theme = {
  colors: IColors;
  spacing: ISpacing;
  borderRadius: IBorderRadius;
  borderWidth: IBorderWidth;
  avatarSize: IAvatarSize;
  iconSize: IIconSize;
  typography: ITypography;
  timing: Timing;
  shadow: IShadow;
  layout: ILayout;
  animation: IAnimation;
  isDark: boolean;
};

// Here we define our themes.
export const lightTheme: Theme = {
  colors: colorsLight,
  spacing,
  typography,
  borderRadius,
  borderWidth,
  avatarSize,
  iconSize,
  timing,
  shadow,
  layout,
  animation,
  isDark: false,
};
export const darkTheme: Theme = {
  colors: colorsDark,
  spacing,
  typography,
  borderRadius,
  borderWidth,
  avatarSize,
  iconSize,
  timing,
  shadow,
  layout,
  animation,
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
  SystemUI.setBackgroundColorAsync(theme.colors.background.surface);
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

type UseAppThemeValue = {
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
};

export type IThemed = ReturnType<typeof useAppTheme>["themed"];

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

  // TODO: Remove after debugging is done
  // Light/dark mode color scheme logging
  useEffect(() => {
    logger.debug("=== Theme Debug ===", {
      systemColorScheme: Appearance.getColorScheme(),
      platformVersion: Platform.Version,
      themeContext: themeContext,
      isDarkTheme: themeVariant.isDark,
      navThemeDark: navTheme.dark,
    });
  }, [themeContext, themeVariant, navTheme]);

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

export function flattenThemedStyles<T>(args: {
  styles: ThemedStyle<T> | StyleProp<T> | ThemedStyleArray<T>;
  theme: Theme;
}): T {
  const { styles, theme } = args;
  const flatStyles = [styles].flat(3);

  const processedStyles = flatStyles.map((style) => {
    if (typeof style === "function") {
      return (style as ThemedStyle<T>)(theme);
    }
    return style;
  });

  return Object.assign({}, ...processedStyles);
}
