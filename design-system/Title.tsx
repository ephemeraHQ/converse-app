import { memo } from "react";

import { AnimatedText, IAnimatedTextProps } from "./Text";

export type ITitleProps = IAnimatedTextProps;

export const Title = memo(({ children, style, ...props }: ITitleProps) => {
  return (
    <AnimatedText preset="heading" style={style} {...props}>
      {children}
    </AnimatedText>
  );
});
