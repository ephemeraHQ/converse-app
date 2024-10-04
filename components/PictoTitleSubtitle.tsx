import Picto from "@components/Picto";
import { AnimatedText, IAnimatedTextProps } from "@design-system/Text";
import { ITitleProps, Title } from "@design-system/Title";
import { AnimatedVStack, IAnimatedVStackProps } from "@design-system/VStack";
import { spacing } from "@theme/spacing";
import React from "react";

import { IPictoProps } from "./Picto/Picto";

export function SubtitleComponent({ style, ...rest }: IAnimatedTextProps) {
  return (
    <AnimatedText
      preset="subheading"
      style={[{ textAlign: "center" }, style]}
      {...rest}
    />
  );
}

export function TitleComponent({ style, ...rest }: ITitleProps) {
  return <Title style={[{ textAlign: "center" }, style]} {...rest} />;
}

export function ContainerComponent({
  children,
  style,
  ...props
}: IAnimatedVStackProps) {
  return (
    <AnimatedVStack
      style={[
        {
          alignItems: "center",
          justifyContent: "center",
          rowGap: spacing.xs,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </AnimatedVStack>
  );
}

export function PictoComponent(props: IPictoProps) {
  return <Picto style={{ height: props.size }} {...props} />;
}

export const PictoTitleSubtitle = {
  Subtitle: SubtitleComponent,
  Title: TitleComponent,
  Container: ContainerComponent,
  Picto: PictoComponent,
};
