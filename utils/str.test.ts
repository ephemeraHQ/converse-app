import { PixelRatio } from "react-native";

import {
  addressPrefix,
  capitalize,
  formatGroupName,
  getTitleFontScale,
  shortDisplayName,
  strByteSize,
} from "./str";

jest.mock("react-native", () => ({
  Dimensions: {
    get: jest.fn().mockReturnValue({ width: 500 }),
  },
  PixelRatio: {
    getFontScale: jest.fn().mockReturnValue(1),
  },
  Platform: {
    OS: "ios",
  },
  TextInput: jest.fn(),
}));

jest.mock("../data/store/accountsStore", () => ({
  getProfilesStore: jest
    .fn()
    .mockReturnValue({ getState: jest.fn().mockReturnValue({ profiles: {} }) }),
  useAccountsList: jest.fn().mockReturnValue(["account1", "account2"]),
  currentAccount: jest.fn().mockReturnValue("currentAccount"),
}));

jest.mock("expo-crypto", () => ({
  getRandomBytesAsync: jest.fn().mockReturnValue([0, 1, 2, 3, 4]),
}));

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn().mockReturnValue(""),
}));

jest.mock("../data/store/chatStore", () => ({
  XmtpConversation: jest.fn(),
}));

jest.mock("../data/store/profilesStore", () => ({
  ProfilesStoreType: jest.fn(),
}));

describe("shortDisplayName", () => {
  it("should shorten the domain correctly based on screen width", () => {
    expect(shortDisplayName("thisisaverylongdomainname.com")).toBe(
      "thisisaverylong..."
    );
  });

  it("should return the original domain if shorter than maxLength", () => {
    expect(shortDisplayName("short.com")).toBe("short.com");
  });

  it("should return an empty string if domain is undefined", () => {
    expect(shortDisplayName(undefined)).toBe("");
  });
});

describe("capitalize", () => {
  it("should capitalize the first letter of the string", () => {
    expect(capitalize("hello")).toBe("Hello");
  });
});

describe("addressPrefix", () => {
  it("should return the first 6 characters of the address", () => {
    expect(addressPrefix("0x1234567890abcdef")).toBe("0x1234");
  });

  it("should return the original address if shorter than 6 characters", () => {
    expect(addressPrefix("0x123")).toBe("0x123");
  });
});

describe("getTitleFontScale", () => {
  it("should return the correct title font scale", () => {
    expect(getTitleFontScale()).toBe(1);
  });

  it("should return a font scale not greater than 1.235", () => {
    jest.spyOn(PixelRatio, "getFontScale").mockReturnValue(1.5);
    expect(getTitleFontScale()).toBe(1.235);
  });
});

describe("strByteSize", () => {
  it("should return the byte size of a string", () => {
    expect(strByteSize("hello")).toBe(5);
  });
});

describe("formatGroupName", () => {
  it("should return groupName if provided", () => {
    const topic = "randomTopicString";
    const groupName = "MyGroupName";
    const result = formatGroupName(topic, groupName);
    expect(result).toBe(groupName);
  });

  it("should format topic if groupName is not provided", () => {
    const topic = "/xmtp/mls/1/g-dab181fefd94578cc791bcc42d3b207c/proto";
    const formattedString = "Utah bluebird delta";
    const result = formatGroupName(topic);

    expect(result).toBe(formattedString);
  });
});
