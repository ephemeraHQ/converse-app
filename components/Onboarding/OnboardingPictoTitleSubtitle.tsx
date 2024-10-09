import { IAnimatedVStackProps } from "@design-system/VStack";
import { spacing } from "@theme/spacing";
import React from "react";

import { PictoTitleSubtitle } from "../PictoTitleSubtitle";

function OnboardingContainerComponent({
  children,
  style,
  ...props
}: IAnimatedVStackProps) {
  return (
    <PictoTitleSubtitle.Container
      style={[
        {
          marginBottom: spacing.lg,
          marginTop: spacing.lg,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </PictoTitleSubtitle.Container>
  );
}

export const OnboardingPictoTitleSubtitle = {
  Subtitle: PictoTitleSubtitle.Subtitle,
  Title: PictoTitleSubtitle.Title,
  Container: OnboardingContainerComponent,
  Picto: PictoTitleSubtitle.Picto,
};
