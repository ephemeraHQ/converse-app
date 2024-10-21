import { memo } from "react";

import { Button } from "../../design-system/Button/Button";
import { IButtonProps } from "../../design-system/Button/Button.props";
import { Optional } from "../../types/general";

export const OnboardingPrimaryCtaButton = memo(
  function OnboardingPrimaryCtaButton(
    props: Optional<IButtonProps, "variant">
  ) {
    const { style, variant, ...rest } = props;
    return (
      <Button
        style={[
          {
            marginHorizontal: 0, // TODO: Remove when we fixed the button component
          },
          style,
        ]}
        variant={variant || "fill"}
        {...rest}
      />
    );
  }
);
