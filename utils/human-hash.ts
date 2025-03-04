import { capitalize } from "./str"

// Word list for human-readable hash generation
const wordlist = [
  "ack",
  "alabama",
  "alanine",
  "alaska",
  "alpha",
  "angel",
  "apart",
  "april",
  "arizona",
  "arkansas",
  "artist",
  "asparagus",
  "aspen",
  "august",
  "autumn",
  "avocado",
  "bacon",
  "bakerloo",
  "batman",
  "beer",
  "berlin",
  "beryllium",
  "black",
  "blossom",
  "blue",
  "bluebird",
  "bravo",
  "bulldog",
  "burger",
  "butter",
  "california",
  "carbon",
  "cardinal",
  "carolina",
  "carpet",
  "cat",
  "ceiling",
  "charlie",
  "chicken",
  "coffee",
  "cola",
  "cold",
  "colorado",
  "comet",
  "connecticut",
  "crazy",
  "cup",
  "dakota",
  "december",
  "delaware",
  "delta",
  "diet",
  "don",
  "double",
  "early",
  "earth",
  "east",
  "echo",
  "edward",
  "eight",
  "eighteen",
  "eleven",
  "emma",
  "enemy",
  "equal",
  "failed",
  "fanta",
  "fifteen",
  "fillet",
  "finch",
  "fish",
  "five",
  "fix",
  "floor",
  "florida",
  "football",
  "four",
  "fourteen",
  "foxtrot",
  "freddie",
  "friend",
  "fruit",
  "gee",
  "georgia",
  "glucose",
  "golf",
  "green",
  "grey",
  "hamper",
  "happy",
  "harry",
  "hawaii",
  "helium",
  "high",
  "hot",
  "hotel",
  "hydrogen",
  "idaho",
  "illinois",
  "india",
  "indigo",
  "ink",
  "iowa",
  "island",
  "item",
  "jersey",
  "jig",
  "johnny",
  "juliet",
  "july",
  "jupiter",
  "kansas",
  "kentucky",
  "kilo",
  "king",
  "kitten",
  "lactose",
  "lake",
  "lamp",
  "lemon",
  "leopard",
  "lima",
  "lion",
  "lithium",
  "london",
  "louisiana",
  "low",
  "magazine",
  "magnesium",
  "maine",
  "mango",
  "march",
  "mars",
  "maryland",
  "massachusetts",
  "may",
  "mexico",
  "michigan",
  "mike",
  "minnesota",
  "mirror",
  "mississippi",
  "missouri",
  "mobile",
  "mockingbird",
  "monkey",
  "montana",
  "moon",
  "mountain",
  "muppet",
  "music",
  "nebraska",
  "neptune",
  "network",
  "nevada",
  "nine",
  "nineteen",
  "nitrogen",
  "north",
  "november",
  "nuts",
  "october",
  "ohio",
  "oklahoma",
  "one",
  "orange",
  "oranges",
  "oregon",
  "oscar",
  "oven",
  "oxygen",
  "papa",
  "paris",
  "pasta",
  "pennsylvania",
  "pip",
  "pizza",
  "pluto",
  "potato",
  "princess",
  "purple",
  "quebec",
  "queen",
  "quiet",
  "red",
  "river",
  "robert",
  "robin",
  "romeo",
  "rugby",
  "sad",
  "salami",
  "saturn",
  "september",
  "seven",
  "seventeen",
  "shade",
  "sierra",
  "single",
  "sink",
  "six",
  "sixteen",
  "skylark",
  "snake",
  "social",
  "sodium",
  "solar",
  "south",
  "spaghetti",
  "speaker",
  "spring",
  "stairway",
  "steak",
  "stream",
  "summer",
  "sweet",
  "table",
  "tango",
  "ten",
  "tennessee",
  "tennis",
  "texas",
  "thirteen",
  "three",
  "timing",
  "triple",
  "twelve",
  "twenty",
  "two",
  "uncle",
  "undress",
  "uniform",
  "uranus",
  "utah",
  "vegan",
  "venus",
  "vermont",
  "victor",
  "video",
  "violet",
  "virginia",
  "washington",
  "west",
  "whiskey",
  "white",
  "william",
  "winner",
  "winter",
  "wisconsin",
  "wolfram",
  "wyoming",
  "xray",
  "yankee",
  "yellow",
  "zebra",
  "zulu",
] as const

type Separator = string
type DigestString = string

type HumanizeOptions = {
  numWords?: number
  separator?: Separator
  shouldCapitalize?: boolean
}

/**
 * Converts a hexadecimal digest into human-readable words
 */
export function humanize(
  digest: DigestString,
  { numWords = 4, separator = "-", shouldCapitalize = false }: HumanizeOptions = {},
): string {
  if (!/^[a-fA-F0-9]+$/.test(digest)) {
    throw new Error("Digest must be hexadecimal characters only")
  }

  const chars = digest.split("")
  const bytes: number[] = []

  // Convert hex pairs to bytes
  for (let i = 0; i < chars.length && bytes.length < numWords; i += 2) {
    const hex = parseInt(chars[i] + (chars[i + 1] || "0"), 16)
    bytes.push(hex)
  }

  const compressedBytes = compress(bytes, numWords)

  return compressedBytes
    .map((byte) => {
      const word = wordlist[byte]
      return shouldCapitalize ? capitalize(word) : word
    })
    .join(separator)
}

/**
 * Compresses a list of byte values to a fixed target length
 */
export function compress(bytes: number[], target: number): number[] {
  const paddedBytes = [...bytes]

  // Zero-pad if needed
  for (let i = target - bytes.length; i > 0; i--) {
    paddedBytes.push(0)
  }

  if (target === paddedBytes.length) {
    return paddedBytes
  }

  const bytesLength = paddedBytes.length
  const segSize = Math.floor(bytesLength / target)
  const segments: number[] = []

  // Split bytes into target segments using XOR for compression
  for (let i = 0; i < bytesLength; i++) {
    const segNum = Math.min(Math.floor(i / segSize), target - 1)
    segments[segNum] =
      segments[segNum] !== undefined ? segments[segNum] ^ paddedBytes[i] : paddedBytes[i]
  }

  return segments
}

type UUIDResult = {
  humanized: string
  digest: string
}

/**
 * Generates a UUID and its human-readable representation
 */
export function uuid(numWords?: number, separator?: Separator): UUIDResult {
  const digest = "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })

  return {
    humanized: humanize(digest, { numWords, separator }),
    digest,
  }
}

/**
 * Converts a human-readable hash back to its digest form
 */
export function dehumanize(human: string, separator: Separator = "-"): string | false {
  const words = human.split(separator)
  const result: string[] = []

  for (const word of words) {
    const found = unhash(word)
    if (found === false) {
      return false
    }
    result.push(found.toString(16))
  }

  return result.join("")
}

/**
 * Binary search for the index of a human hash word
 */
export function unhash(human: string): number | false {
  const searchTerm = human.toLowerCase()
  let upper = 255
  let lower = 0

  while (upper >= lower) {
    const middle = lower + Math.floor((upper - lower) / 2)
    const foundHash = wordlist[middle].toLowerCase()

    if (foundHash < searchTerm) {
      lower = middle + 1
    } else if (foundHash > searchTerm) {
      upper = middle - 1
    } else {
      return middle
    }
  }

  return false
}
