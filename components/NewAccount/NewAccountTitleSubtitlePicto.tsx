import { IAnimatedVStackProps } from "@design-system/VStack";
import { spacing } from "@theme/spacing";

import { PictoTitleSubtitle } from "../PictoTitleSubtitle";

function NewAccountContainerComponent({
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

export const NewAccountPictoTitleSubtitle = {
  Subtitle: PictoTitleSubtitle.Subtitle,
  Title: PictoTitleSubtitle.Title,
  Container: NewAccountContainerComponent,
  Picto: PictoTitleSubtitle.Picto,
};
