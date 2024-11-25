import {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  Keyframe,
  LinearTransition,
} from "react-native-reanimated";

import { SpringConfig } from "react-native-reanimated/lib/typescript/reanimated2/animation/springUtils";
import { timing } from "./timing";

export const SICK_EASE_OUT = Easing.out(Easing.cubic);

export const SICK_DAMPING = 80;

export const SICK_STIFFNESS = 200;

export const SICK_SPRING_CONFIG: SpringConfig = {
  damping: SICK_DAMPING,
  stiffness: SICK_STIFFNESS,
};

const easings = {
  // Ease In
  easeInQuad: [0.55, 0.085, 0.68, 0.53],
  easeInCubic: [0.55, 0.055, 0.675, 0.19],
  easeInQuart: [0.895, 0.03, 0.685, 0.22],
  easeInQuint: [0.755, 0.05, 0.855, 0.06],
  easeInExpo: [0.95, 0.05, 0.795, 0.035],
  easeInCirc: [0.6, 0.04, 0.98, 0.335],

  // Ease Out
  easeOutQuad: [0.25, 0.46, 0.45, 0.94],
  easeOutCubic: [0.215, 0.61, 0.355, 1],
  easeOutQuart: [0.165, 0.84, 0.44, 1],
  easeOutQuint: [0.23, 1, 0.32, 1],
  easeOutExpo: [0.19, 1, 0.22, 1],
  easeOutCirc: [0.075, 0.82, 0.165, 1],

  // Ease In Out
  easeInOutQuad: [0.455, 0.03, 0.515, 0.955],
  easeInOutCubic: [0.645, 0.045, 0.355, 1],
  easeInOutQuart: [0.77, 0, 0.175, 1],
  easeInOutQuint: [0.86, 0, 0.07, 1],
  easeInOutExpo: [1, 0, 0, 1],
  easeInOutCirc: [0.785, 0.135, 0.15, 0.86],
};

export const SICK_MASS = 1.03;

export const HOLD_ITEM_TRANSFORM_DURATION = 280;

export const animation = {
  spring: {
    damping: SICK_DAMPING,
    stiffness: SICK_STIFFNESS,
  },

  easings,

  contextMenuSpring: {
    damping: SICK_DAMPING,
    stiffness: SICK_STIFFNESS,
    mass: SICK_MASS,
    restDisplacementThreshold: 0.001,
    restSpeedThreshold: 0.001,
  },

  contextMenuHoldDuration: HOLD_ITEM_TRANSFORM_DURATION,

  springLayoutTransition: LinearTransition.springify(),

  reanimatedSpringLayoutTransition: LinearTransition.springify()
    .damping(SICK_DAMPING)
    .stiffness(SICK_STIFFNESS),

  reanimatedFadeInDownSpring: FadeInDown.easing(SICK_EASE_OUT)
    .stiffness(SICK_STIFFNESS)
    .damping(SICK_DAMPING),

  fadeInUpSpring: () =>
    FadeInUp.easing(SICK_EASE_OUT)
      .stiffness(SICK_STIFFNESS)
      .damping(SICK_DAMPING),

  reanimatedFadeInSpring: FadeIn.springify()
    .stiffness(SICK_STIFFNESS)
    .damping(SICK_DAMPING),

  reanimatedFadeOutSpring: FadeOut.springify()
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
