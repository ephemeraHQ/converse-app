import { Easing, FadeInDown, FadeInUp } from "react-native-reanimated";

import { timing } from "./timing";
import { SpringConfig } from "react-native-reanimated/lib/typescript/reanimated2/animation/springUtils";

export const SICK_EASE_OUT = Easing.out(Easing.cubic);

export const SICK_DAMPING = 80;

export const SICK_STIFFNESS = 200;

export const SICK_SPRING_CONFIG: SpringConfig = {
  damping: SICK_DAMPING,
  stiffness: SICK_STIFFNESS,
};

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

  fadeInUpSlow: () => FadeInUp.duration(timing.slow).easing(SICK_EASE_OUT),

  fadeInDownSlow: () => FadeInDown.duration(timing.slow).easing(SICK_EASE_OUT),
};
