import { jest, test } from "@jest/globals";
import { screen } from "@testing-library/react-native";
import React from "react";
import { measureRenders } from "reassure";

import Avatar from "../Avatar";

jest.setTimeout(600_000);

const TestComponent = ({ uri }: { uri?: string }) => <Avatar uri={uri} />;

test("Empty Avatar 10 runs", async () => {
  const scenario = async () => {
    await screen.findByTestId("avatar-placeholder");
  };

  await measureRenders(<TestComponent />, { scenario, runs: 10 });
});

test("Empty Avatar 50 runs", async () => {
  const scenario = async () => {
    await screen.findByTestId("avatar-placeholder");
  };

  await measureRenders(<TestComponent />, { scenario, runs: 50 });
});

test("Avatar Image 10 runs", async () => {
  const scenario = async () => {
    await screen.findByTestId("avatar-image");
  };

  await measureRenders(<TestComponent uri="https://picsum.photos/200/300" />, {
    scenario,
    runs: 10,
  });
});

test("Avatar Image 50 runs", async () => {
  const scenario = async () => {
    await screen.findByTestId("avatar-image");
  };

  await measureRenders(<TestComponent uri="https://picsum.photos/200/300" />, {
    scenario,
    runs: 50,
  });
});
