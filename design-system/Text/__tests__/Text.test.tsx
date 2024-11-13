// __tests__/Text.test.tsx
import React from "react";
import { render } from "@testing-library/react-native";
import { Text } from "..";
import type { Text as RNText } from "react-native";

jest.mock("@theme/useAppTheme", () => ({
  useAppTheme: jest.fn(() => ({
    themed: jest.fn((style) => style),
  })),
}));

describe("Text Component", () => {
  it("renders correctly with default props", () => {
    const { toJSON } = render(<Text>Default Text</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it("renders correctly with translation key", () => {
    const { toJSON } = render(<Text tx="walletSelector.title" />);
    expect(toJSON()).toMatchSnapshot();
  });

  it("applies weight and size styles", () => {
    const { toJSON } = render(
      <Text weight="bold" size="lg">
        Styled Text
      </Text>
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it("applies color style", () => {
    const { toJSON } = render(<Text color="primary">Colored Text</Text>);
    expect(toJSON()).toMatchSnapshot();
  });

  it("forwards ref correctly", () => {
    const ref = React.createRef<RNText>();
    render(<Text ref={ref}>Ref Text</Text>);
    expect(ref.current).not.toBeNull();
  });

  it("renders children correctly", () => {
    const { getByText } = render(<Text>Child Text</Text>);
    expect(getByText("Child Text")).toBeTruthy();
  });
});
