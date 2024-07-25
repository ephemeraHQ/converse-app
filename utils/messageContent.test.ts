import { getUrlToRender, isAllEmojisAndMaxThree } from "./messageContent";

describe("isAllEmojisAndMaxThree", () => {
  it("should return true for strings with up to three emojis and no spaces", () => {
    expect(isAllEmojisAndMaxThree("😊😊😊")).toBe(true);
    expect(isAllEmojisAndMaxThree("😊😊")).toBe(true);
    expect(isAllEmojisAndMaxThree("😊")).toBe(true);
  });

  it("should return false for strings with more than three emojis", () => {
    expect(isAllEmojisAndMaxThree("😊😊😊😊")).toBe(false);
  });

  it("should return false for strings containing non-emoji characters", () => {
    expect(isAllEmojisAndMaxThree("😊a😊")).toBe(false);
    expect(isAllEmojisAndMaxThree("😊😊😊a")).toBe(false);
  });

  it("should return true for strings with up to three emojis and spaces", () => {
    expect(isAllEmojisAndMaxThree("😊 😊 😊")).toBe(true);
    expect(isAllEmojisAndMaxThree("😊 😊")).toBe(true);
    expect(isAllEmojisAndMaxThree("😊")).toBe(true);
  });

  it("should return false for strings with more than three emojis even with spaces", () => {
    expect(isAllEmojisAndMaxThree("😊 😊 😊 😊")).toBe(false);
  });

  it("should return false for empty strings", () => {
    expect(isAllEmojisAndMaxThree("")).toBe(false);
  });
});

describe("getUrlToRender", () => {
  it("should return the hostname of a full URL", () => {
    expect(getUrlToRender("https://example.com/path")).toBe("example.com");
    expect(getUrlToRender("http://example.com")).toBe("example.com");
    expect(getUrlToRender("https://subdomain.example.com/path")).toBe(
      "subdomain.example.com"
    );
    expect(getUrlToRender("www://example.com")).toBe("example.com");
    expect(getUrlToRender("ftp://example.com/resource")).toBe("example.com");
  });

  it("should return the hostname for URLs with different ports", () => {
    expect(getUrlToRender("http://example.com:8080/path")).toBe("example.com");
    expect(getUrlToRender("https://example.com:443")).toBe("example.com");
  });

  it("should return the hostname for URLs with query parameters", () => {
    expect(getUrlToRender("https://example.com/path?query=123")).toBe(
      "example.com"
    );
    expect(
      getUrlToRender("https://example.com/path?query=123&another=456")
    ).toBe("example.com");
  });

  it("should handle URLs with fragments", () => {
    expect(getUrlToRender("https://example.com/path#fragment")).toBe(
      "example.com"
    );
    expect(getUrlToRender("https://example.com/path?query=123#fragment")).toBe(
      "example.com"
    );
  });
});
