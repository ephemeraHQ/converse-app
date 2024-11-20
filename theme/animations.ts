import {
  Easing,
  FadeInDown,
  FadeInUp,
  Keyframe,
  LinearTransition,
} from "react-native-reanimated";

import { timing } from "./timing";

export const SICK_EASE_OUT = Easing.out(Easing.cubic);

export const SICK_DAMPING = 80;

export const SICK_STIFFNESS = 200;

export const animation = {
  spring: {
    damping: SICK_DAMPING,
    stiffness: SICK_STIFFNESS,
  },

  springLayoutTransition: LinearTransition.springify()
    .damping(SICK_DAMPING)
    .stiffness(SICK_STIFFNESS),

  fadeInDownSpring: () =>
    FadeInDown.easing(SICK_EASE_OUT)
      .stiffness(SICK_STIFFNESS)
      .damping(SICK_DAMPING),

  fadeInUpSpring: () =>
    FadeInUp.easing(SICK_EASE_OUT)
      .stiffness(SICK_STIFFNESS)
      .damping(SICK_DAMPING),

  fadeInUpSlow: () => FadeInUp.duration(timing.slow).easing(SICK_EASE_OUT),

  fadeInDownSlow: () => FadeInDown.duration(timing.slow).easing(SICK_EASE_OUT),

  reanimatedFadeOutScaleOut: new Keyframe({
    0: {
      opacity: 1,
      transform: [{ scale: 1 }],
    },
    100: {
      opacity: 0,
      transform: [{ scale: 0 }],
    },
  }).duration(500),

  reanimatedFadeInScaleIn: new Keyframe({
    0: {
      opacity: 0,
      transform: [{ scale: 0 }],
    },
    100: {
      opacity: 1,
      transform: [{ scale: 1 }],
    },
  }).duration(500),
};

export type IAnimation = typeof animation;
