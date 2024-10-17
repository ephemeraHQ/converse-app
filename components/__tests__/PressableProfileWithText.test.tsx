import { PressableProfileWithText } from "@components/PressableProfileWithText";
import { render, fireEvent } from "@testing-library/react-native";
import { navigate } from "@utils/navigation";

// Mock the navigate function from @utils/navigation
jest.mock("@utils/navigation", () => ({
  navigate: jest.fn(),
}));

describe("PressableProfileWithTextInner", () => {
  const profileAddress = "0x123";
  const profileDisplay = "User123";
  const text = "Hello User123, welcome!";
  const textStyle = { fontSize: 18 };
  const pressableTextStyle = { fontSize: 18, color: "blue" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders ParsedText with the correct text and style", () => {
    const { getByText } = render(
      <PressableProfileWithText
        profileAddress={profileAddress}
        profileDisplay={profileDisplay}
        text={text}
        textStyle={textStyle}
      />
    );

    const renderedText = getByText(text);
    expect(renderedText).toBeTruthy();
    expect(renderedText.props.style).toEqual(textStyle);
  });

  it("calls navigate to profile on profileDisplay press", () => {
    const { getByText } = render(
      <PressableProfileWithText
        profileAddress={profileAddress}
        profileDisplay={profileDisplay}
        text={text}
        textStyle={textStyle}
      />
    );

    const parsedText = getByText(profileDisplay);

    // Simulate the press on the profileDisplay text
    fireEvent.press(parsedText);

    expect(navigate).toHaveBeenCalledWith("Profile", {
      address: profileAddress,
    });
  });

  it("does not call navigate when profileAddress is undefined", () => {
    const { getByText } = render(
      <PressableProfileWithText
        profileAddress={undefined as any}
        profileDisplay={profileDisplay}
        text={text}
        textStyle={textStyle}
      />
    );

    const parsedText = getByText(profileDisplay);

    // Simulate the press on the profileDisplay text
    fireEvent.press(parsedText);

    expect(navigate).not.toHaveBeenCalled();
  });

  it("renders with the provided style", () => {
    const { getByText } = render(
      <PressableProfileWithText
        profileAddress={profileAddress}
        profileDisplay={profileDisplay}
        text={text}
        textStyle={textStyle}
      />
    );

    const parsedText = getByText(profileDisplay);

    expect(parsedText.props.style).toEqual([textStyle, undefined]);
  });

  it("renders with the provided style for pressable text", () => {
    const { getByText } = render(
      <PressableProfileWithText
        profileAddress={profileAddress}
        profileDisplay={profileDisplay}
        text={text}
        textStyle={textStyle}
        pressableTextStyle={pressableTextStyle}
      />
    );

    const parsedText = getByText(profileDisplay);

    expect(parsedText.props.style).toEqual([textStyle, pressableTextStyle]);
  });
});
