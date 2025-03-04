import { addressPrefix, capitalize, shortDisplayName } from "./str"

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
}))

jest.mock("expo-crypto", () => ({
  getRandomBytesAsync: jest.fn().mockReturnValue([0, 1, 2, 3, 4]),
}))

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn().mockReturnValue(""),
}))

describe("shortDisplayName", () => {
  it("should shorten the domain correctly based on screen width", () => {
    expect(shortDisplayName("thisisaverylongdomainname.com")).toBe("thisisaverylong...")
  })

  it("should return the original domain if shorter than maxLength", () => {
    expect(shortDisplayName("short.com")).toBe("short.com")
  })

  it("should return an empty string if domain is undefined", () => {
    expect(shortDisplayName(undefined)).toBe("")
  })
})

describe("capitalize", () => {
  it("should capitalize the first letter of the string", () => {
    expect(capitalize("hello")).toBe("Hello")
  })
})

describe("addressPrefix", () => {
  it("should return the first 6 characters of the address", () => {
    expect(addressPrefix("0x1234567890abcdef")).toBe("0x1234")
  })

  it("should return the original address if shorter than 6 characters", () => {
    expect(addressPrefix("0x123")).toBe("0x123")
  })
})
