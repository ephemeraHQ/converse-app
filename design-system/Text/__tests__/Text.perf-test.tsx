// __tests__/Text.performance.test.tsx
import { jest, test } from "@jest/globals";
import { screen } from "@testing-library/react-native";
import React from "react";

import { Text } from "../Text";
import {
  measureRendersWithThemeProvider,
  renderWithThemeProvider,
} from "@design-system/test-utils/renderWithThemeProvider";

jest.setTimeout(600_000);

test("Text Component with default props - 10 runs", async () => {
  const scenario = async () => {
    renderWithThemeProvider(<Text>Default Text</Text>);
    await screen.findByText("Default Text");
  };

  await measureRendersWithThemeProvider(<Text>Default Text</Text>, {
    scenario,
    runs: 10,
  });
});

test("Text Component with weight and size - 10 runs", async () => {
  const scenario = async () => {
    renderWithThemeProvider(
      <Text weight="bold" size="lg">
        Styled Text
      </Text>
    );
    await screen.findByText("Styled Text");
  };

  await measureRendersWithThemeProvider(
    <Text weight="bold" size="lg">
      Styled Text
    </Text>,
    { scenario, runs: 10 }
  );
});

test("Text Component with translation key - 10 runs", async () => {
  const translatedText = "Accept"; // Ensure this matches your translation file

  const scenario = async () => {
    renderWithThemeProvider(<Text tx="accept" />);
    await screen.findByText(translatedText);
  };

  await measureRendersWithThemeProvider(<Text tx="accept" />, {
    scenario,
    runs: 10,
  });
});

test("Text Component with color prop - 10 runs", async () => {
  const scenario = async () => {
    renderWithThemeProvider(<Text color="primary">Colored Text</Text>);
    await screen.findByText("Colored Text");
  };

  await measureRendersWithThemeProvider(
    <Text color="primary">Colored Text</Text>,
    {
      scenario,
      runs: 10,
    }
  );
});
