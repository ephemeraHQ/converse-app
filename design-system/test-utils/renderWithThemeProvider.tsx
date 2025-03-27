import { NavigationContainer } from "@react-navigation/native"
import { render } from "@testing-library/react-native"
import { measureRenders, MeasureRendersOptions } from "reassure"
import { useThemeProvider } from "@/theme/use-app-theme"

export const TestThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { themeScheme, setThemeContextOverride, ThemeProvider, navigationTheme } =
    useThemeProvider()

  return (
    <NavigationContainer theme={navigationTheme}>
      <ThemeProvider value={{ themeScheme, setThemeContextOverride }}>{children}</ThemeProvider>
    </NavigationContainer>
  )
}

export const renderWithThemeProvider = (ui: React.ReactElement) =>
  render(<TestThemeProvider>{ui}</TestThemeProvider>)

export const measureRendersWithThemeProvider = (
  ui: React.ReactElement,
  options: MeasureRendersOptions,
) => measureRenders(<TestThemeProvider>{ui}</TestThemeProvider>, options)
