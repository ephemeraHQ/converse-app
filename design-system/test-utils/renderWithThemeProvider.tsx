import { NavigationContainer } from "@react-navigation/native";
import { render } from "@testing-library/react-native";
import { useThemeProvider } from "@theme/useAppTheme";

const TestThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    themeScheme,
    setThemeContextOverride,
    ThemeProvider,
    navigationTheme,
  } = useThemeProvider();

  return (
    <NavigationContainer theme={navigationTheme}>
      <ThemeProvider value={{ themeScheme, setThemeContextOverride }}>
        {children}
      </ThemeProvider>
    </NavigationContainer>
  );
};

export const renderWithThemeProvider = (ui: React.ReactElement) =>
  render(<TestThemeProvider>{ui}</TestThemeProvider>);
