import Picto from "@components/Picto";
import { AnimatedText, IAnimatedTextProps } from "@design-system/Text";
import { AnimatedVStack, IAnimatedVStackProps } from "@design-system/VStack";
import { spacing } from "@theme/spacing";
import React, { memo } from "react";

import { useAppTheme } from "../theme/useAppTheme";
import { IPicto, IPictoProps } from "./Picto/Picto";

const SubtitleComponent = memo(function SubtitleComponent({
  style,
  ...rest
}: IAnimatedTextProps) {
  return <AnimatedText style={[{ textAlign: "center" }, style]} {...rest} />;
});

const TitleComponent = memo(function TitleComponent({
  style,
  ...rest
}: IAnimatedTextProps) {
  return (
    <AnimatedText
      preset="title"
      style={[{ textAlign: "center" }, style]}
      {...rest}
    />
  );
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
  const { theme } = useAppTheme();
  const { size = theme.spacing["4xl"], ...rest } = props;
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

  const { theme } = useAppTheme();

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
          size={theme.iconSize.lg} // Todo replace with new sizes later
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
