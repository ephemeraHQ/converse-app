import { useHeaderHeight } from "@react-navigation/elements"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { shortAddress } from "@utils/strings/shortAddress"
import React, { useState } from "react"
import { Platform, Share, View } from "react-native"
import QRCode from "react-native-qrcode-svg"
import { Avatar } from "@/components/avatar"
import Button from "@/components/Button/Button"
import { Screen } from "@/components/screen/screen"
import { config } from "@/config"
import { Text } from "@/design-system/Text"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { translate } from "@/i18n"
import { NavigationParamList } from "@/navigation/navigation.types"
import { useHeader } from "@/navigation/use-header"
import { useAppTheme } from "@/theme/use-app-theme"

type IShareProfileScreenProps = NativeStackScreenProps<NavigationParamList, "ShareProfile">

export function ShareProfileScreen({ route, navigation }: IShareProfileScreenProps) {
  const { theme } = useAppTheme()
  const { inboxId } = useSafeCurrentSender()
  const headerHeight = useHeaderHeight()
  const [copiedLink, setCopiedLink] = useState(false)

  const { username, displayName, avatarUrl } = usePreferredDisplayInfo({
    inboxId,
  })
  
  const profileUrl = `https://${username || inboxId}.${config.app.webDomain}`

  const shareDict = Platform.OS === "ios" ? { url: profileUrl } : { message: profileUrl }

  const shareButtonText = copiedLink
    ? translate("Link copied")
    : translate("Copy link")

  useHeader({
    title: "Share Profile",
    onBack: () => navigation.goBack(),
  })

  async function handleShare() {
    await Share.share(shareDict)
    setCopiedLink(true)
  }

  return (
    <Screen safeAreaEdges={["bottom"]} contentContainerStyle={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background.surface,
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Avatar uri={avatarUrl} name={displayName} style={{ alignSelf: "center" }} />
          <Text
            preset="title"
            style={{
              marginTop: 8,
              textAlign: "center",
            }}
          >
            {displayName || shortAddress(inboxId)}
          </Text>
          {displayName && (
            <Text
              preset="formLabel"
              style={{
                marginHorizontal: 20,
                textAlign: "center",
              }}
            >
              {displayName || shortAddress(inboxId)}
            </Text>
          )}
        </View>

        <View
          style={{
            alignSelf: "center",
            justifyContent: "center",
            marginTop: 40,
          }}
        >
          <QRCode
            size={220}
            value={profileUrl}
            backgroundColor={theme.colors.background.surface}
            color={theme.colors.text.primary}
          />
        </View>

        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            alignItems: "center",
            paddingHorizontal: theme.spacing.lg,
          }}
        >
          <Button
            style={{ width: "100%" }}
            title={shareButtonText}
            picto={copiedLink ? "checkmark" : "doc.on.doc"}
            onPress={handleShare}
          />
        </View>

        <View style={{ height: headerHeight }} />
      </View>
    </Screen>
  )
}
