import { ReactElement } from "react"
import { StyleProp, TextStyle, ViewStyle } from "react-native"
import { IPicto } from "@/components/Picto/Picto.types"
import { ExtendedEdge, useSafeAreaInsetsStyle } from "@/components/screen/screen.helpers"
import { useHeaderHeight } from "@/design-system/Header/Header.utils"
import { translate } from "@/i18n"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"
import { debugBorder } from "@/utils/debug-style"
import { HStack } from "../HStack"
import { ITextProps, Text } from "../Text"
import { ITouchableOpacityProps } from "../TouchableOpacity"
import { VStack } from "../VStack"
import { HeaderAction } from "./HeaderAction"

export type HeaderProps = {
  titleStyle?: StyleProp<TextStyle>
  titleContainerStyle?: StyleProp<ViewStyle>
  style?: StyleProp<ViewStyle>
  containerStyle?: StyleProp<ViewStyle>
  backgroundColor?: string
  title?: ITextProps["text"]
  titleTx?: ITextProps["tx"]
  titleComponent?: ReactElement
  titleTxOptions?: ITextProps["txOptions"]
  withBottomBorder?: boolean
  leftIcon?: IPicto
  leftIconColor?: string
  leftText?: ITextProps["text"]
  leftTx?: ITextProps["tx"]
  LeftActionComponent?: ReactElement
  leftTxOptions?: ITextProps["txOptions"]
  onLeftPress?: ITouchableOpacityProps["onPress"]
  rightIcon?: IPicto
  rightIconColor?: string
  rightText?: ITextProps["text"]
  rightTx?: ITextProps["tx"]
  RightActionComponent?: ReactElement
  rightTxOptions?: ITextProps["txOptions"]
  onRightPress?: ITouchableOpacityProps["onPress"]
  safeAreaEdges?: ExtendedEdge[]
  isCollapsible?: boolean
  onBack?: () => void
}

export function Header(props: HeaderProps) {
  const { theme, themed } = useAppTheme()

  const {
    backgroundColor = theme.colors.background.surfaceless,
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
    safeAreaEdges = [],
    title,
    titleComponent,
    titleTx,
    titleTxOptions,
    titleContainerStyle: $titleContainerStyleOverride,
    style: $styleOverride,
    titleStyle: $titleStyleOverride,
    containerStyle: $containerStyleOverride,
    isCollapsible,
    onBack,
    withBottomBorder,
  } = props

  const $containerInsets = useSafeAreaInsetsStyle(safeAreaEdges)

  const titleContent = titleTx ? translate(titleTx, titleTxOptions) : title

  const headerHeight = useHeaderHeight()

  return (
    <VStack
      // {...debugBorder()}
      style={[
        $container,
        $containerInsets,
        { backgroundColor },
        withBottomBorder && {
          borderBottomWidth: theme.borderWidth.xs,
          borderBottomColor: theme.colors.border.subtle,
        },
        $containerStyleOverride,
      ]}
    >
      <HStack
        // {...debugBorder("yellow")}
        style={[themed($wrapper), $styleOverride, { height: headerHeight }]}
      >
        <HStack
          // {...debugBorder("red")}
          style={$contentContainer}
        >
          {onBack ? (
            <HeaderAction icon="chevron.left" onPress={onBack} backgroundColor={backgroundColor} />
          ) : (
            (leftTx || leftText || leftIcon || LeftActionComponent) && (
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
            )
          )}

          {titleComponent ? (
            titleComponent
          ) : titleContent ? (
            <VStack style={[themed($titleContainer), $titleContainerStyleOverride]}>
              <Text
                preset="body"
                text={titleContent}
                style={$titleStyleOverride}
                onPress={onBack}
              />
            </VStack>
          ) : null}
        </HStack>

        {isCollapsible && (
          <VStack style={themed($collapsibleContainer)}>
            <VStack style={themed($collapsibleIndicator)} />
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
  )
}

const $wrapper: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingHorizontal: spacing.xs,
})

const $container: ViewStyle = {
  width: "100%",
}

const $contentContainer: ViewStyle = {
  flex: 1,
  alignItems: "center",
}

const $titleContainer: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1,
})

const $collapsibleContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  position: "absolute",
  top: spacing.xxs,
  right: 0,
  left: 0,
  alignSelf: "center",
  justifyContent: "center",
  alignItems: "center",
  zIndex: -1,
})

const $collapsibleIndicator: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.fill.tertiary,
  height: spacing.xxxs,
  width: spacing.xl,
  borderRadius: 100,
})
