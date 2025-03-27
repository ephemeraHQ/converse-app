import React, { memo, ReactNode } from "react"
import { StyleProp, ViewStyle } from "react-native"
import { BottomSheetHeaderBase } from "@/design-system/BottomSheet/BottomSheetHeader"
import { Button } from "@/design-system/Button/Button"
import { IButtonProps } from "@/design-system/Button/Button.props"
import { IImageProps, Image } from "@/design-system/image"
import { Loader } from "@/design-system/loader"
import { Pressable } from "@/design-system/Pressable"
import { Text } from "@/design-system/Text"
import { IVStackProps, VStack } from "@/design-system/VStack"
import { useAppTheme } from "@/theme/use-app-theme"

/**
 * Header component for connect wallet
 */
type IConnectWalletHeaderProps = {
  title: string
  onClose?: () => void
}

export const ConnectWalletHeader = memo(function ConnectWalletHeader(
  props: IConnectWalletHeaderProps,
) {
  const { title, onClose } = props

  return <BottomSheetHeaderBase title={title} onClose={onClose} />
})

/**
 * Wallet item component for displaying wallet options
 */
type IConnectWalletItemProps = {
  name: string
  imageSource?: IImageProps["source"]
  image?: ReactNode
  helperText?: string
  endElement?: ReactNode
  isDisabled?: boolean
  onPress?: () => void
}

export const ConnectWalletItem = memo(function ConnectWalletItem(props: IConnectWalletItemProps) {
  const { name, imageSource, image, isDisabled, onPress, helperText, endElement } = props
  const { theme } = useAppTheme()

  return (
    <Pressable
      // {...debugBorder()}
      disabled={isDisabled}
      withHaptics
      style={{
        flexDirection: "row",
        alignItems: "center",
        columnGap: theme.spacing.xs,
        paddingVertical: theme.spacing.xs,
        ...(isDisabled && {
          opacity: 0.3,
        }),
      }}
      onPress={onPress}
    >
      {imageSource && (
        <Image
          source={imageSource}
          style={{
            width: theme.spacing.xxl,
            height: theme.spacing.xxl,
            borderRadius: theme.borderRadius.xs,
          }}
        />
      )}
      {image && image}
      <VStack
        style={{
          flex: 1,
        }}
      >
        {helperText && (
          <Text preset="small" color="secondary">
            {helperText}
          </Text>
        )}
        <Text>{name}</Text>
      </VStack>
      {endElement}
    </Pressable>
  )
})

/**
 * Primary button for connect wallet flows
 */
type IConnectWalletPrimaryButtonProps = {
  text: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
}

export const ConnectWalletPrimaryButton = memo(function ConnectWalletPrimaryButton(
  props: IConnectWalletPrimaryButtonProps,
) {
  const { text, onPress, loading, disabled } = props

  return <Button text={text} onPress={onPress} loading={loading} disabled={disabled} />
})

/**
 * Cancel button for connect wallet flows
 */
export const ConnectWalletLinkButton = memo(function ConnectWalletLinkButton(props: IButtonProps) {
  const { text = "Cancel", onPress, ...rest } = props

  return <Button variant="link" text={text} onPress={onPress} {...rest} />
})

export const ConnectWalletOutlineButton = memo(function ConnectWalletCancelOutlineButton(
  props: IButtonProps,
) {
  const { text = "Cancel", onPress, ...rest } = props

  return <Button variant="outline" text={text} onPress={onPress} {...rest} />
})

/**
 * Button container for connect wallet flows
 */
export const ConnectWalletButtonContainer = memo(function ConnectWalletButtonContainer(
  props: IVStackProps,
) {
  const { children, style, ...rest } = props
  const { theme } = useAppTheme()

  return (
    <VStack
      style={[
        {
          rowGap: theme.spacing.xxs,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </VStack>
  )
})

/**
 * Content container for connect wallet
 */
type IConnectWalletContentContainerProps = {
  children: ReactNode
}

export const ConnectWalletContentContainer = memo(function ConnectWalletContentContainer(
  props: IConnectWalletContentContainerProps,
) {
  const { children } = props
  const { theme } = useAppTheme()

  return (
    <VStack
      style={{
        paddingHorizontal: theme.spacing.lg,
        // rowGap: theme.spacing.xs,
      }}
    >
      {children}
    </VStack>
  )
})

/**
 * Text section for connect wallet
 */
type IConnectWalletTextSectionProps = {
  text?: string
  secondaryText?: string
  style?: StyleProp<ViewStyle>
}

export const ConnectWalletTextSection = memo(function ConnectWalletTextSection(
  props: IConnectWalletTextSectionProps,
) {
  const { text, secondaryText, style } = props
  const { theme } = useAppTheme()

  return (
    <VStack
      // {...debugBorder()}
      style={[{ rowGap: theme.spacing.sm }, style]}
    >
      {text && <Text>{text}</Text>}
      {secondaryText && (
        <Text preset="small" color="secondary">
          {secondaryText}
        </Text>
      )}
    </VStack>
  )
})

export const ConnectWalletLoadingContent = memo(function ConnectWalletLoadingContent() {
  return (
    <>
      <ConnectWalletHeader title="Loading..." />
      <ConnectWalletContentContainer>
        <Loader />
      </ConnectWalletContentContainer>
    </>
  )
})

/**
 * Error content for connect wallet
 */
export const ConnectWalletErrorContent = memo(function ConnectWalletErrorContent(props: {
  onPressCancel: () => void
}) {
  const { onPressCancel } = props

  return (
    <ConnectWalletLayout
      header={<ConnectWalletHeader title="Something went wrong" />}
      text={
        <ConnectWalletTextSection
          text="Please try again"
          secondaryText="If the problem persists, please contact support."
        />
      }
      content={<></>}
      buttons={<ConnectWalletOutlineButton onPress={onPressCancel} />}
    />
  )
})

/**
 * Layout component for connect wallet
 */
export const ConnectWalletLayout = memo(function ConnectWalletLayout(props: {
  header: ReactNode
  text: ReactNode
  content: ReactNode
  buttons: ReactNode
}) {
  const { header, text, content, buttons } = props
  const { theme } = useAppTheme()

  return (
    <>
      {header}
      <ConnectWalletContentContainer>
        <VStack
          style={{
            paddingBottom: theme.spacing.md,
          }}
        >
          {text}
        </VStack>
        {content}
      </ConnectWalletContentContainer>
      <ConnectWalletButtonContainer
        style={{
          paddingTop: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
        }}
      >
        {buttons}
      </ConnectWalletButtonContainer>
    </>
  )
})
