import { shortAddress } from "./shortAddress"

describe("shortAddress", () => {
  it("should shorten the address correctly", () => {
    expect(shortAddress("0x1234567890abcdef")).toBe("0x1234...cdef")
  })

  it("should return the original address if shorter than 7 characters", () => {
    expect(shortAddress("0x123")).toBe("0x123")
  })

  it("should return an empty string if address is empty", () => {
    expect(shortAddress("")).toBe("")
  })
})
