import {
  ICustomParseShape,
  IDefaultParseShape,
  IParseShape,
} from "@/components/parsed-text/parsed-text.types"
import { ObjectTyped } from "@/utils/object-typed"

type ITextPart = {
  children: string
  _matched?: boolean
  [key: string]: any
}

export function parseText(args: { text: string; patterns: ICustomParseShape[] }): ITextPart[] {
  const { text, patterns } = args

  return patterns
    .reduce(
      (parsedTexts: ITextPart[], pattern) => {
        const maxMatches = pattern.nonExhaustiveMaxMatchCount ?? Infinity
        let currentMatches = 0

        return parsedTexts.flatMap((part) => {
          if (part._matched) return part

          const regex = new RegExp(
            pattern.pattern.source,
            pattern.pattern.flags.includes("g")
              ? pattern.pattern.flags
              : pattern.pattern.flags + "g",
          )
          const results: ITextPart[] = []
          let textLeft = part.children
          let lastIndex = 0

          for (const match of textLeft.matchAll(regex)) {
            if (currentMatches++ >= maxMatches) break

            const index = match.index!

            // Add text before match
            if (index > lastIndex) {
              results.push({ children: textLeft.slice(lastIndex, index) })
            }

            // Add matched part with props
            results.push(createMatchedPart({ pattern, match, index }))

            lastIndex = index + match[0].length
          }

          // Add remaining text
          if (lastIndex < textLeft.length) {
            results.push({ children: textLeft.slice(lastIndex) })
          }

          return results
        })
      },
      [{ children: text }],
    )
    .filter((part) => part.children)
}

function createMatchedPart(args: {
  pattern: ICustomParseShape
  match: RegExpMatchArray
  index: number
}): ITextPart {
  const { pattern, match, index } = args
  const text = match[0]

  const props = ObjectTyped.entries(pattern).reduce(
    (acc, [key, value]) => {
      if (["pattern", "renderText", "nonExhaustiveMaxMatchCount"].includes(key)) {
        return acc
      }

      if (typeof value === "function") {
        // Support onPress / onLongPress functions
        acc[key] = () =>
          // @ts-ignore
          value(text, index)
      } else {
        // Set a prop with an arbitrary name to the value in the match-config
        acc[key] = value
      }
      return acc
    },
    {} as Record<string, any>,
  )

  return {
    ...props,
    children: pattern.renderText?.(text, match) ?? text,
    _matched: true,
  }
}

export function isDefaultPattern(pattern: IParseShape): pattern is IDefaultParseShape {
  return "type" in pattern
}

export function isCustomPattern(pattern: IParseShape): pattern is ICustomParseShape {
  return !("type" in pattern)
}

// Define the known patterns provided by the library
export const PATTERNS = {
  url: /(https?:\/\/|www\.)[-a-zA-Z0-9@:%._+~#=]{1,256}\.(xn--)?[a-z0-9-]{2,20}\b([-a-zA-Z0-9@:%_+[\],.~#?&//=]*[-a-zA-Z0-9@:%_+\]~#?&//=])*/i,
  phone: /[\+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,7}/,
  email: /\S+@\S+\.\S+/,
}
