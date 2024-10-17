import { memo } from "react";
import { useColorScheme } from "react-native";

import { TouchableOpacity } from "../../../design-system/TouchableOpacity";
import { textSecondaryColor } from "../../../styles/colors";
import { PictoSizes } from "../../../styles/sizes";
import Picto from "../../Picto";
import { IPictoProps } from "../../Picto/Picto";

type IScreenHeaderIconButtonProps = IPictoProps & {
  onPress: () => void;
};

export const ScreenHeaderIconButton = memo(function ScreenHeaderIconButton(
  props: IScreenHeaderIconButtonProps
) {
  const { onPress, ...rest } = props;

  const colorScheme = useColorScheme();

  return (
    <TouchableOpacity>
      <Picto
        size={PictoSizes.navItem}
        color={textSecondaryColor(colorScheme)}
        {...rest}
      />
    </TouchableOpacity>
  );
});
