import { ReactElement } from "react";
import { StyleProp, TextStyle, ViewStyle } from "react-native";

import { IPicto } from "../../components/Picto/Picto";
import {
  ExtendedEdge,
  useSafeAreaInsetsStyle,
} from "../../components/Screen/ScreenComp/Screen.helpers";
import { translate } from "../../i18n";
import { ThemedStyle, useAppTheme } from "../../theme/useAppTheme";
import { HStack } from "../HStack";
import { ITextProps, Text } from "../Text";
import { ITouchableOpacityProps } from "../TouchableOpacity";
import { VStack } from "../VStack";
import { HeaderAction } from "./HeaderAction";

export type HeaderProps = {
  /**
   * The layout of the title relative to the action components.
   * - `center` will force the title to always be centered relative to the header. If the title or the action buttons are too long, the title will be cut off.
   * - `flex` will attempt to center the title relative to the action buttons. If the action buttons are different widths, the title will be off-center relative to the header.
   */
  titleMode?: "center" | "flex";
  /**
   * Optional title style override.
   */
  titleStyle?: StyleProp<TextStyle>;
  /**
   * Optional outer title container style override.
   */
  titleContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Optional inner header wrapper style override.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Optional outer header container style override.
   */
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Background color
   */
  backgroundColor?: string;
  /**
   * Title text to display if not using `tx` or nested components.
   */
  title?: ITextProps["text"];
  /**
   * Title text which is looked up via i18n.
   */
  titleTx?: ITextProps["tx"];
  /**
   * Optional options to pass to i18n. Useful for interpolation
   * as well as explicitly setting locale or translation fallbacks.
   */
  titleTxOptions?: ITextProps["txOptions"];
  /**
   * Icon that should appear on the left.
   * Can be used with `onLeftPress`.
   */
  leftIcon?: IPicto;
  /**
   * An optional tint color for the left icon
   */
  leftIconColor?: string;
  /**
   * Left action text to display if not using `leftTx`.
   * Can be used with `onLeftPress`. Overrides `leftIcon`.
   */
  leftText?: ITextProps["text"];
  /**
   * Left action text text which is looked up via i18n.
   * Can be used with `onLeftPress`. Overrides `leftIcon`.
   */
  leftTx?: ITextProps["tx"];
  /**
   * Left action custom ReactElement if the built in action props don't suffice.
   * Overrides `leftIcon`, `leftTx` and `leftText`.
   */
  LeftActionComponent?: ReactElement;
  /**
   * Optional options to pass to i18n. Useful for interpolation
   * as well as explicitly setting locale or translation fallbacks.
   */
  leftTxOptions?: ITextProps["txOptions"];
  /**
   * What happens when you press the left icon or text action.
   */
  onLeftPress?: TouchableOpacityProps["onPress"];
  /**
   * Icon that should appear on the right.
   * Can be used with `onRightPress`.
   */
  rightIcon?: IPicto;
  /**
   * An optional tint color for the right icon
   */
  rightIconColor?: string;
  /**
   * Right action text to display if not using `rightTx`.
   * Can be used with `onRightPress`. Overrides `rightIcon`.
   */
  rightText?: ITextProps["text"];
  /**
   * Right action text text which is looked up via i18n.
   * Can be used with `onRightPress`. Overrides `rightIcon`.
   */
  rightTx?: ITextProps["tx"];
  /**
   * Right action custom ReactElement if the built in action props don't suffice.
   * Overrides `rightIcon`, `rightTx` and `rightText`.
   */
  RightActionComponent?: ReactElement;
  /**
   * Optional options to pass to i18n. Useful for interpolation
   * as well as explicitly setting locale or translation fallbacks.
   */
  rightTxOptions?: ITextProps["txOptions"];
  /**
   * What happens when you press the right icon or text action.
   */
  onRightPress?: ITouchableOpacityProps["onPress"];
  /**
   * Override the default edges for the safe area.
   */
  safeAreaEdges?: ExtendedEdge[];
};

export function Header(props: HeaderProps) {
  const {
    theme: { colors },
    themed,
  } = useAppTheme();

  const {
    backgroundColor = colors.background.surface,
    LeftActionComponent,
    leftIcon,
    leftIconColor,
    leftText,
    leftTx,
    leftTxOptions,
    onLeftPress,
    onRightPress,
    RightActionComponent,
    rightIcon,
    rightIconColor,
    rightText,
    rightTx,
    rightTxOptions,
    safeAreaEdges = ["top"],
    title,
    titleMode = "center",
    titleTx,
    titleTxOptions,
    titleContainerStyle: $titleContainerStyleOverride,
    style: $styleOverride,
    titleStyle: $titleStyleOverride,
    containerStyle: $containerStyleOverride,
  } = props;

  const $containerInsets = useSafeAreaInsetsStyle(safeAreaEdges);

  const titleContent = titleTx ? translate(titleTx, titleTxOptions) : title;

  return (
    <VStack
      style={[
        $container,
        $containerInsets,
        { backgroundColor },
        $containerStyleOverride,
      ]}
    >
      <HStack style={[$styles.row, $wrapper, $styleOverride]}>
        <HeaderAction
          tx={leftTx}
          text={leftText}
          icon={leftIcon}
          iconColor={leftIconColor}
          onPress={onLeftPress}
          txOptions={leftTxOptions}
          backgroundColor={backgroundColor}
          ActionComponent={LeftActionComponent}
        />

        {!!titleContent && (
          <VStack
            style={[
              titleMode === "center" && themed($titleWrapperCenter),
              titleMode === "flex" && $titleWrapperFlex,
              $titleContainerStyleOverride,
            ]}
            pointerEvents="none"
          >
            <Text
              weight="medium"
              size="md"
              text={titleContent}
              style={[$title, $titleStyleOverride]}
            />
          </VStack>
        )}

        <HeaderAction
          tx={rightTx}
          text={rightText}
          icon={rightIcon}
          iconColor={rightIconColor}
          onPress={onRightPress}
          txOptions={rightTxOptions}
          backgroundColor={backgroundColor}
          ActionComponent={RightActionComponent}
        />
      </HStack>
    </VStack>
  );
}

const $wrapper: ViewStyle = {
  height: 56,
  alignItems: "center",
  justifyContent: "space-between",
};

const $container: ViewStyle = {
  width: "100%",
};

const $title: TextStyle = {
  textAlign: "center",
};

const $titleWrapperCenter: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  width: "100%",
  position: "absolute",
  paddingHorizontal: spacing.xxl,
  zIndex: 1,
});

const $titleWrapperFlex: ViewStyle = {
  justifyContent: "center",
  flexGrow: 1,
};
