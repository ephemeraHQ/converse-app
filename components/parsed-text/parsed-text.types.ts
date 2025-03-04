import { TextProps, TextStyle } from "react-native"

type KnownParsePattern = "url" | "phone" | "email"

type IBaseParseShape = Omit<TextProps, "onPress" | "onLongPress"> & {
  /** Function to rewrite the matched string */
  renderText?: (matchingString: string, matches: string[]) => string
  onPress?: (text: string, index: number) => void
  onLongPress?: (text: string, index: number) => void
  style?: TextStyle
}

export type IDefaultParseShape = IBaseParseShape & {
  /** Key of the known pattern you'd like to configure */
  type: KnownParsePattern
  /** Limit the number of matches found */
  nonExhaustiveMaxMatchCount?: number
}

export type ICustomParseShape = IBaseParseShape & {
  /** Custom pattern to match */
  pattern: RegExp
  /** Limit the number of matches found */
  nonExhaustiveMaxMatchCount?: number
}

export type IParseShape = IDefaultParseShape | ICustomParseShape
