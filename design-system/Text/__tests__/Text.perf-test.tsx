// __tests__/Text.performance.test.tsx
import { jest, test } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import React from "react";
import { measureRenders } from "reassure";

import { Text } from "../Text";
import { useThemeProvider } from "@theme/useAppTheme";

jest.setTimeout(600_000);

const TestApp = ({ children }: { children: React.ReactNode }) => {
  const { themeScheme, setThemeContextOverride, ThemeProvider } =
    useThemeProvider();

  return (
    <ThemeProvider value={{ themeScheme, setThemeContextOverride }}>
      {children}
    </ThemeProvider>
  );
};

test("Text Component with default props - 10 runs", async () => {
  const scenario = async () => {
    render(
      <TestApp>
        <Text>Default Text</Text>
      </TestApp>
    );
    await screen.findByText("Default Text");
  };

  await measureRenders(
    <TestApp>
      <Text>Default Text</Text>
    </TestApp>,
    { scenario, runs: 10 }
  );
});

test("Text Component with weight and size - 10 runs", async () => {
  const scenario = async () => {
    render(
      <TestApp>
        <Text weight="bold" size="lg">
          Styled Text
        </Text>
      </TestApp>
    );
    await screen.findByText("Styled Text");
  };

  await measureRenders(
    <TestApp>
      <Text weight="bold" size="lg">
        Styled Text
      </Text>
    </TestApp>,
    { scenario, runs: 10 }
  );
});

test("Text Component with translation key - 10 runs", async () => {
  const translatedText = "Accept"; // Ensure this matches your translation file

  const scenario = async () => {
    render(
      <TestApp>
        <Text tx="accept" />
      </TestApp>
    );
    await screen.findByText(translatedText);
  };

  await measureRenders(
    <TestApp>
      <Text tx="accept" />
    </TestApp>,
    { scenario, runs: 10 }
  );
});

test("Text Component with color prop - 10 runs", async () => {
  const scenario = async () => {
    render(
      <TestApp>
        <Text color="primary">Colored Text</Text>
      </TestApp>
    );
    await screen.findByText("Colored Text");
  };

  await measureRenders(
    <TestApp>
      <Text color="primary">Colored Text</Text>
    </TestApp>,
    { scenario, runs: 10 }
  );
});
