import { DarkTheme, DefaultTheme } from "@react-navigation/native"
import { animation, IAnimation } from "@theme/animations"
import { ILayout, layout } from "@theme/layout"
import { IShadow, shadow } from "@theme/shadow"
import * as SystemUI from "expo-system-ui"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { StyleProp, useColorScheme } from "react-native"
import { ILoaderSize, loaderSize } from "@/theme/loader"
import { avatarSize, IAvatarSize } from "./avatar"
import { borderRadius, IBorderRadius } from "./border-radius"
import { borderWidth, IBorderWidth } from "./borders"
import { colorsDark } from "./colorsDark"
import { colorsLight, IColors } from "./colorsLight"
import { iconSize, IIconSize } from "./icon"
import { ISpacing, spacing } from "./spacing"
import { Timing, timing } from "./timing"
import { ITypography, typography } from "./typography"

export type ThemeContexts = "light" | "dark" | undefined

// The overall Theme object should contain all of the data you need to style your app.
export type Theme = {
  colors: IColors
  spacing: ISpacing
  borderRadius: IBorderRadius
  borderWidth: IBorderWidth
  avatarSize: IAvatarSize
  iconSize: IIconSize
  typography: ITypography
  timing: Timing
  shadow: IShadow
  layout: ILayout
  animation: IAnimation
  loaderSize: ILoaderSize
  isDark: boolean
}

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
  loaderSize,
  isDark: false,
}
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
  loaderSize,
  isDark: true,
}

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
export type ThemedStyle<T> = (theme: Theme) => T
export type ThemedStyleArray<T> = (
  | ThemedStyle<T>
  | StyleProp<T>
  | (StyleProp<T> | ThemedStyle<T>)[]
)[]

type ThemeContextType = {
  themeScheme: ThemeContexts
  setThemeContextOverride: (newTheme: ThemeContexts) => void
}

// create a React context and provider for the current theme
export const ThemeContext = createContext<ThemeContextType>({
  themeScheme: undefined, // default to the system theme
  setThemeContextOverride: (_newTheme: ThemeContexts) => {
    console.error("Tried to call setThemeContextOverride before the ThemeProvider was initialized")
  },
})

const themeContextToTheme = (themeContext: ThemeContexts): Theme =>
  themeContext === "dark" ? darkTheme : lightTheme

const setImperativeThemeing = (theme: Theme) => {
  SystemUI.setBackgroundColorAsync(theme.colors.background.surfaceless)
}

export const useThemeProvider = (initialTheme: ThemeContexts = undefined) => {
  const colorScheme = useColorScheme()
  const [overrideTheme, setTheme] = useState<ThemeContexts>(initialTheme)

  const setThemeContextOverride = useCallback((newTheme: ThemeContexts) => {
    setTheme(newTheme)
  }, [])

  const themeScheme = overrideTheme || colorScheme || "light"
  const navigationTheme = themeScheme === "dark" ? DarkTheme : DefaultTheme

  useEffect(() => {
    setImperativeThemeing(themeContextToTheme(themeScheme))
  }, [themeScheme])

  return {
    themeScheme,
    navigationTheme,
    setThemeContextOverride,
    ThemeProvider: ThemeContext.Provider,
  }
}

type UseAppThemeValue = {
  // A function to set the theme context override (for switching modes)
  setThemeContextOverride: (newTheme: ThemeContexts) => void
  // The current theme object
  theme: Theme
  // The current theme context "light" | "dark"
  themeContext: ThemeContexts
  // A function to apply the theme to a style object.
  // See examples in the components directory or read the docs here:
  // https://docs.infinite.red/ignite-cli/boilerplate/app/utils/
  themed: <T>(styleOrStyleFn: ThemedStyle<T> | StyleProp<T> | ThemedStyleArray<T>) => T
  // Change color scheme to test design system
  toggleTheme: () => void
}

export type IThemed = ReturnType<typeof useAppTheme>["themed"]

/**
 * Custom hook that provides the app theme and utility functions for theming.
 *
 * @returns {UseAppThemeReturn} An object containing various theming values and utilities.
 * @throws {Error} If used outside of a ThemeProvider.
 */
export const useAppTheme = (): UseAppThemeValue => {
  const colorScheme = useColorScheme()
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  const { themeScheme: overrideTheme, setThemeContextOverride } = context

  const themeContext: ThemeContexts = useMemo(
    () => overrideTheme || (colorScheme === "dark" ? "dark" : "light"),
    [overrideTheme, colorScheme],
  )

  const themeVariant: Theme = useMemo(() => themeContextToTheme(themeContext), [themeContext])

  const toggleTheme = useCallback(() => {
    const newTheme = themeContext === "dark" ? "light" : "dark"
    setThemeContextOverride(newTheme)
  }, [themeContext, setThemeContextOverride])

  const themed = useCallback(
    <T>(styleOrStyleFn: ThemedStyle<T> | StyleProp<T> | ThemedStyleArray<T>) => {
      const flatStyles = [styleOrStyleFn].flat(3)
      const stylesArray = flatStyles.map((f) => {
        if (typeof f === "function") {
          return (f as ThemedStyle<T>)(themeVariant)
        } else {
          return f
        }
      })

      // Flatten the array of styles into a single object
      return Object.assign({}, ...stylesArray) as T
    },
    [themeVariant],
  )

  return {
    setThemeContextOverride,
    theme: themeVariant,
    themeContext,
    themed,
    toggleTheme,
  }
}

export function flattenThemedStyles<T>(args: {
  styles: ThemedStyle<T> | StyleProp<T> | ThemedStyleArray<T>
  theme: Theme
}): T {
  const { styles, theme } = args
  const flatStyles = [styles].flat(3)

  const processedStyles = flatStyles.map((style) => {
    if (typeof style === "function") {
      return (style as ThemedStyle<T>)(theme)
    }
    return style
  })

  return Object.assign({}, ...processedStyles)
}
