import { memo } from "react";

import { PictoSizes } from "../../styles/sizes";
import { spacing } from "../../theme";
import { IPicto } from "../Picto/Picto";
import { PictoTitleSubtitle } from "../PictoTitleSubtitle";

export const NewAccountTitleSubtitlePicto = memo(function (props: {
  title: string;
  picto?: IPicto;
  subtitle?: string;
}) {
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
          size={PictoSizes.onboardingComponent}
        />
      )}
      <PictoTitleSubtitle.Title>{title}</PictoTitleSubtitle.Title>
      {!!subtitle && (
        <PictoTitleSubtitle.Subtitle>{subtitle}</PictoTitleSubtitle.Subtitle>
      )}
    </PictoTitleSubtitle.Container>
  );
});
