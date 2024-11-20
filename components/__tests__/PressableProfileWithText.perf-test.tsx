import { jest, test } from "@jest/globals";
import { screen } from "@testing-library/react-native";
import React from "react";
import { measureRenders } from "reassure";

import { PressableProfileWithText } from "../PressableProfileWithText";

jest.setTimeout(600_000);

const mockedProfileName1 = "Profile 1";
const mockedProfileAddress1 = "0x1234567890abcdef";
const mockedText1 = `Hello ${mockedProfileName1}`;

const TestComponent = () => (
  <PressableProfileWithText
    profileDisplay={mockedProfileName1}
    profileAddress={mockedProfileAddress1}
    text={mockedText1}
    onPress={() => {}}
  />
);

test("Empty PressableProfileWithText 10 runs", async () => {
  const scenario = async () => {
    await screen.findByText(mockedProfileName1);
  };

  await measureRenders(<TestComponent />, { scenario, runs: 10 });
});

test("Empty PressableProfileWithText 50 runs", async () => {
  const scenario = async () => {
    await screen.findByText(mockedProfileName1);
  };

  await measureRenders(<TestComponent />, { scenario, runs: 50 });
});

test("PressableProfileWithText Image 10 runs", async () => {
  const scenario = async () => {
    await screen.findByText(mockedProfileName1);
  };

  await measureRenders(<TestComponent />, {
    scenario,
    runs: 10,
  });
});

test("PressableProfileWithText Image 50 runs", async () => {
  const scenario = async () => {
    await screen.findByText(mockedProfileName1);
  };

  await measureRenders(<TestComponent />, {
    scenario,
    runs: 50,
  });
});
