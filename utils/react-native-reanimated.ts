import { BaseAnimationBuilder, EntryExitAnimationFunction } from "react-native-reanimated"
import { ReanimatedKeyframe } from "react-native-reanimated/lib/typescript/layoutReanimation/animationBuilder/Keyframe"

// couldn't find this type exported in react-native-reanimated
export type EntryOrExitLayoutType =
  | BaseAnimationBuilder
  | typeof BaseAnimationBuilder
  | EntryExitAnimationFunction
  | ReanimatedKeyframe
