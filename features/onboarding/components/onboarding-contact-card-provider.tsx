import { useThemeProvider } from "@/theme/useAppTheme";
import { memo } from "react";

/**
 * The Onboarding Contact Card will use inverted colors.
 * Rather than passing a bunch of inverted props around, just creating a mini theme provider for it specifically
 */
export const OnboardingContactCardThemeProvider = memo(
  function OnboardingContactCardThemeProvider({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const { themeScheme, setThemeContextOverride, ThemeProvider } =
      useThemeProvider();

    const invertedTheme = themeScheme === "light" ? "dark" : "light";

    return (
      <ThemeProvider
        value={{ themeScheme: invertedTheme, setThemeContextOverride }}
      >
        {children}
      </ThemeProvider>
    );
  }
);
