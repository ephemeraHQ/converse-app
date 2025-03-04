import { memo } from "react"
import {
  TouchableWithoutFeedback as RNTouchableWithoutFeedback,
  TouchableWithoutFeedbackProps,
} from "react-native"

export const TouchableWithoutFeedback = memo(function TouchableWithoutFeedback(
  props: TouchableWithoutFeedbackProps,
) {
  return <RNTouchableWithoutFeedback {...props} />
})
