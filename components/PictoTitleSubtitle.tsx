import Picto from "@components/Picto";
import { AnimatedText, IAnimatedTextProps } from "@design-system/Text";
import { ITitleProps, Title } from "@design-system/Title";
import { AnimatedVStack, IAnimatedVStackProps } from "@design-system/VStack";
import { spacing } from "@theme/spacing";
import React, { memo } from "react";

import { PictoSizes } from "../styles/sizes";
import { IPicto, IPictoProps } from "./Picto/Picto";

const SubtitleComponent = memo(function SubtitleComponent({
  style,
  ...rest
}: IAnimatedTextProps) {
  return (
    <AnimatedText
      preset="subheading"
      style={[{ textAlign: "center" }, style]}
      {...rest}
    />
  );
});

const TitleComponent = memo(function TitleComponent({
  style,
  ...rest
}: ITitleProps) {
  return <Title style={[{ textAlign: "center" }, style]} {...rest} />;
});

const ContainerComponent = memo(function ContainerComponent({
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
});

const PictoComponent = memo(function PictoComponent(props: IPictoProps) {
  const { size = spacing.xxxl, ...rest } = props;
  return <Picto size={size} style={{ height: size }} {...rest} />;
});

export type IPictoTitleSubtitleAllProps = {
  title: string;
  picto?: IPicto;
  subtitle?: string;
};

const PictoTitleSubtitleAll = memo(function (
  props: IPictoTitleSubtitleAllProps
) {
  const { picto, title, subtitle } = props;

  return (
    <PictoTitleSubtitle.Container
      style={{
        // ...debugBorder(),
        marginBottom: spacing.lg,
      }}
    >
      {!!picto && (
        <PictoTitleSubtitle.Picto
          picto={picto}
          size={PictoSizes.onboardingComponent} // Todo replace with new sizes later
        />
      )}
      <PictoTitleSubtitle.Title>{title}</PictoTitleSubtitle.Title>
      {!!subtitle && (
        <PictoTitleSubtitle.Subtitle>{subtitle}</PictoTitleSubtitle.Subtitle>
      )}
    </PictoTitleSubtitle.Container>
  );
});

export const PictoTitleSubtitle = {
  All: PictoTitleSubtitleAll,
  Subtitle: SubtitleComponent,
  Title: TitleComponent,
  Container: ContainerComponent,
  Picto: PictoComponent,
};
