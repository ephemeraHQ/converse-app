import { ScrollViewProps, StyleProp, ViewStyle } from "react-native"
import { ExtendedEdge } from "./screen.helpers"

type BaseScreenProps = {
  /**
   * Children components.
   */
  children?: React.ReactNode
  /**
   * Style for the outer content container useful for padding & margin.
   */
  style?: StyleProp<ViewStyle>
  /**
   * Style for the inner content container useful for padding & margin.
   */
  contentContainerStyle?: StyleProp<ViewStyle>
  /**
   * Override the default edges for the safe area.
   */
  safeAreaEdges?: ExtendedEdge[]
  /**
   * Background color
   */
  backgroundColor?: string
  /**
   * Pass any additional props directly to the KeyboardAvoidingView component.
   */
  // KeyboardAvoidingViewProps?: KeyboardControllerProps;
  /**
   * By how much should we offset the keyboard? Defaults to 0.
   */
  keyboardOffset?: number
}

export type FixedScreenProps = {
  preset?: "fixed"
} & BaseScreenProps

export type ScrollScreenProps = {
  preset?: "scroll"
  /**
   * Should keyboard persist on screen tap. Defaults to handled.
   * Only applies to scroll preset.
   */
  keyboardShouldPersistTaps?: "handled" | "always" | "never"
  /**
   * Pass any additional props directly to the ScrollView component.
   */
  ScrollViewProps?: ScrollViewProps
} & BaseScreenProps

export type AutoScreenProps = {
  preset?: "auto"
  /**
   * Threshold to trigger the automatic disabling/enabling of scroll ability.
   * Defaults to `{ percent: 0.92 }`.
   */
  scrollEnabledToggleThreshold?: { percent?: number; point?: number }
} & Omit<ScrollScreenProps, "preset">

export type IScreenProps = ScrollScreenProps | FixedScreenProps | AutoScreenProps
