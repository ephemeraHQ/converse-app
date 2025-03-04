import { getConfig } from "@/config"
import { formatConverseUsername } from "../format-converse-username"

const config = getConfig()

describe("formatConverseUsername", () => {
  it("should return undefined when no username provided", () => {
    const result = formatConverseUsername(undefined)
    expect(result).toBeUndefined()
  })

  it("should format .conversedev.eth/.converse.xyz username and mark as Converse username", () => {
    const result = formatConverseUsername(`louisdev${config.usernameSuffix}`)
    expect(result).toEqual({
      isConverseUsername: true,
      username: "@louisdev",
    })
  })

  it("should return non-Converse usernames as-is with appropriate flag", () => {
    expect(formatConverseUsername("louisdev.eth")).toEqual({
      isConverseUsername: false,
      username: "louisdev.eth",
    })
    expect(formatConverseUsername("louisdev")).toEqual({
      isConverseUsername: false,
      username: "louisdev",
    })
    expect(formatConverseUsername("@louisdev")).toEqual({
      isConverseUsername: false,
      username: "@louisdev",
    })
  })

  it("should return undefined for empty string", () => {
    const result = formatConverseUsername("")
    expect(result).toBeUndefined()
  })
})
