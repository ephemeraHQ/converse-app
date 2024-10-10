import { Easing, FadeInDown, FadeInUp } from "react-native-reanimated";

import { timing } from "./timing";

export const SICK_EASE_OUT = Easing.out(Easing.cubic);

export const SICK_DAMPING = 80;

export const SICK_STIFFNESS = 200;

export const animations = {
  spring: {
    damping: SICK_DAMPING,
    stiffness: SICK_STIFFNESS,
  },

  fadeInDownSpring: () =>
    FadeInDown.easing(SICK_EASE_OUT)
      .stiffness(SICK_STIFFNESS)
      .damping(SICK_DAMPING),

  fadeInUpSpring: () =>
    FadeInUp.easing(SICK_EASE_OUT)
      .stiffness(SICK_STIFFNESS)
      .damping(SICK_DAMPING),

  fadeInUpSlow: () => FadeInUp.duration(timing.medium).easing(SICK_EASE_OUT),

  fadeInDownSlow: () =>
    FadeInDown.duration(timing.medium).easing(SICK_EASE_OUT),
};
