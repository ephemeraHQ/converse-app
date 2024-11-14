import { render } from "@testing-library/react-native";
import { useThemeProvider } from "@theme/useAppTheme";

const TestThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { themeScheme, setThemeContextOverride, ThemeProvider } =
    useThemeProvider();

  return (
    <ThemeProvider value={{ themeScheme, setThemeContextOverride }}>
      {children}
    </ThemeProvider>
  );
};

export const renderWithThemeProvider = (ui: React.ReactElement) =>
  render(<TestThemeProvider>{ui}</TestThemeProvider>);
