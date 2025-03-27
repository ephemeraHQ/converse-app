// eslint-disable-next-line import/no-duplicates
import { format } from "date-fns"
// eslint-disable-next-line import/no-duplicates
import { enUS, fr } from "date-fns/locale"
import { getLocales } from "react-native-localize"
import { getCompactRelativeTime, getRelativeDate, getRelativeDateTime } from "./date"

jest.mock("react-native-localize", () => ({
  getLocales: jest.fn(),
}))

const mockLocaleEnUS = { languageCode: "en", countryCode: "US" }
const mockLocaleFrFR = { languageCode: "fr", countryCode: "FR" }

describe("getRelativeDateTime with en-US locale", () => {
  beforeAll(() => {
    ;(getLocales as jest.Mock).mockReturnValue([mockLocaleEnUS])
  })

  it("should return empty string if date is not provided", () => {
    expect(getRelativeDateTime()).toBe("")
  })

  it("should return time format if date is today", () => {
    const date = new Date()
    expect(getRelativeDateTime(date)).toBe(format(date, "p", { locale: enUS }))
  })

  it('should return "Yesterday" if date is one day ago', () => {
    const date = new Date()
    date.setDate(date.getDate() - 1)
    expect(getRelativeDateTime(date)).toBe("Yesterday")
  })

  it("should return day of the week if date is within the last 7 days", () => {
    const date = new Date()
    date.setDate(date.getDate() - 3)
    expect(getRelativeDateTime(date)).toBe(format(date, "EEEE", { locale: enUS }))
  })

  it("should return date in locale format if date is older than 7 days", () => {
    const date = new Date()
    date.setDate(date.getDate() - 10)
    expect(getRelativeDateTime(date)).toBe(format(date, "P", { locale: enUS }))
  })
})

describe("getRelativeDate with en-US locale", () => {
  beforeAll(() => {
    ;(getLocales as jest.Mock).mockReturnValue([mockLocaleEnUS])
  })

  it("should return empty string if date is not provided", () => {
    expect(getRelativeDate(0)).toBe("")
  })

  it('should return "Today" for any time today', () => {
    const now = new Date()
    // Set to early morning of today (1 AM)
    const todayEarly = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 1, 0, 0)
    expect(getRelativeDate(todayEarly.getTime())).toBe("Today")
  })

  it('should return "Yesterday" if date is one day ago', () => {
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    expect(getRelativeDate(yesterday.getTime())).toBe("Yesterday")
  })

  it("should return day of the week if date is within the last 7 days", () => {
    const now = new Date()
    const threeDaysAgo = new Date(now)
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    expect(getRelativeDate(threeDaysAgo.getTime())).toBe(
      format(threeDaysAgo, "EEEE", { locale: enUS }),
    )
  })

  it("should return date in MMM d format if date is older than 7 days", () => {
    const now = new Date()
    const tenDaysAgo = new Date(now)
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)
    expect(getRelativeDate(tenDaysAgo.getTime())).toBe(
      format(tenDaysAgo, "MMM d", { locale: enUS }),
    )
  })
})

describe("getRelativeDateTime with fr-FR locale", () => {
  beforeAll(() => {
    ;(getLocales as jest.Mock).mockReturnValue([mockLocaleFrFR])
  })

  it("should return empty string if date is not provided", () => {
    expect(getRelativeDateTime()).toBe("")
  })

  it("should return time format if date is today", () => {
    const date = new Date()
    expect(getRelativeDateTime(date)).toBe(format(date, "p", { locale: fr }))
  })

  it('should return "Yesterday" if date is one day ago', () => {
    const date = new Date()
    date.setDate(date.getDate() - 1)
    expect(getRelativeDateTime(date)).toBe("Yesterday")
  })

  it("should return day of the week if date is within the last 7 days", () => {
    const date = new Date()
    date.setDate(date.getDate() - 3)
    expect(getRelativeDateTime(date)).toBe(format(date, "EEEE", { locale: fr }))
  })

  it("should return date in locale format if date is older than 7 days", () => {
    const date = new Date()
    date.setDate(date.getDate() - 10)
    expect(getRelativeDateTime(date)).toBe(format(date, "P", { locale: fr }))
  })
})

describe("getRelativeDate with fr-FR locale", () => {
  beforeAll(() => {
    ;(getLocales as jest.Mock).mockReturnValue([mockLocaleFrFR])
  })

  it("should return empty string if date is not provided", () => {
    expect(getRelativeDate(0)).toBe("")
  })

  it('should return "Today" for any time today', () => {
    const now = new Date()
    // Set to early morning of today (1 AM)
    const todayEarly = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 1, 0, 0)
    expect(getRelativeDate(todayEarly.getTime())).toBe("Today")
  })

  it('should return "Yesterday" if date is one day ago', () => {
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    expect(getRelativeDate(yesterday.getTime())).toBe("Yesterday")
  })

  it("should return day of the week if date is within the last 7 days", () => {
    const now = new Date()
    const threeDaysAgo = new Date(now)
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    expect(getRelativeDate(threeDaysAgo.getTime())).toBe(
      format(threeDaysAgo, "EEEE", { locale: fr }),
    )
  })

  it("should return date in MMM d format if date is older than 7 days", () => {
    const now = new Date()
    const tenDaysAgo = new Date(now)
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)
    expect(getRelativeDate(tenDaysAgo.getTime())).toBe(format(tenDaysAgo, "MMM d", { locale: fr }))
  })
})

describe("getMinimalDate", () => {
  const now = Date.now()

  it("should return an empty string for falsy input", () => {
    expect(getCompactRelativeTime(0)).toBe("")
  })

  it("should return correct minimal timestamp for seconds", () => {
    expect(getCompactRelativeTime(now - 5000)).toBe("5s")
  })

  it("should return correct minimal timestamp for minutes", () => {
    expect(getCompactRelativeTime(now - 5 * 60 * 1000)).toBe("5m")
  })

  it("should return correct minimal timestamp for hours", () => {
    expect(getCompactRelativeTime(now - 5 * 60 * 60 * 1000)).toBe("5h")
  })

  it("should return correct minimal timestamp for days", () => {
    expect(getCompactRelativeTime(now - 5 * 24 * 60 * 60 * 1000)).toBe("5d")
  })

  it("should return correct minimal timestamp for weeks", () => {
    expect(getCompactRelativeTime(now - 14 * 24 * 60 * 60 * 1000)).toBe("2w")
  })

  it("should return correct minimal timestamp for months", () => {
    expect(getCompactRelativeTime(now - 60 * 24 * 60 * 60 * 1000)).toBe("2mo")
  })

  it("should return correct minimal timestamp for years", () => {
    expect(getCompactRelativeTime(now - 2 * 365 * 24 * 60 * 60 * 1000)).toBe("2y")
  })

  it("should not show future", () => {
    expect(getCompactRelativeTime(now + 1)).toBe("0s")
  })
})
