# Example Composite Component Structure

Thierry initially pressented this pattern as part of a design overhaul discussion. This is a great pattern to avoid "leaking" component names into the global namespace. 

We wanted to present this as part of our file/folder structure organiziation as the pattern greatly aids in keeping components organized and usable only within their feature only.

## PictoTitleSubtitle Component

[View component on GitHub](https://github.com/ephemeraHQ/converse-app/blob/717787eddf5f7d921ec44773bf0021ca962e6d56/components/PictoTitleSubtitle.tsx)

## Design System Discussion

**Thierry** (Oct 7th at 12:03 PM):

Hey guys! I made a Loom video going through some of my thoughts on design system, components etc. Would love to hear your thoughts!

[Watch the Loom video](https://www.loom.com/share/9428b13ba2304042a084594b33bff0b9)

[View Slack thread](https://xmtp-labs.slack.com/archives/C07NSHXK693/p1728316993186399)





```tsx
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
```
