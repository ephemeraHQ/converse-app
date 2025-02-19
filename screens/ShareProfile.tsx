import { Avatar } from "@/components/Avatar";
import Button from "@/components/Button/Button";
import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { config } from "@/config";
import { Text } from "@/design-system/Text";
import { useSafeCurrentSender } from "@/features/multi-inbox/multi-inbox.store";
import { useProfileQuery } from "@/features/profiles/profiles.query";
import { translate } from "@/i18n";
import { useHeader } from "@/navigation/use-header";
import { NavigationParamList } from "@/screens/Navigation/Navigation";
import { useHeaderHeight } from "@react-navigation/elements";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AvatarSizes } from "@styles/sizes";
import { useAppTheme } from "@theme/useAppTheme";
import { shortAddress } from "@utils/strings/shortAddress";
import React, { useState } from "react";
import { Platform, Share, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

type IShareProfileScreenProps = NativeStackScreenProps<
  NavigationParamList,
  "ShareProfile"
>;

export function ShareProfileScreen({
  route,
  navigation,
}: IShareProfileScreenProps) {
  const { theme } = useAppTheme();
  const { inboxId } = useSafeCurrentSender();
  const headerHeight = useHeaderHeight();
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: profile } = useProfileQuery({ xmtpId: inboxId });

  const profileUrl = `https://${config.websiteDomain}/dm/${
    profile?.name || shortAddress(inboxId)
  }`;

  const shareDict =
    Platform.OS === "ios" ? { url: profileUrl } : { message: profileUrl };

  const shareButtonText = copiedLink
    ? translate("share_profile.link_copied")
    : translate("share_profile.copy_link");

  useHeader({
    title: translate("share_profile.title"),
    onBack: () => navigation.goBack(),
  });

  async function handleShare() {
    await Share.share(shareDict);
    setCopiedLink(true);
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
          <Avatar
            uri={profile?.avatar}
            name={profile?.name}
            size={AvatarSizes.shareProfile}
            style={{ alignSelf: "center" }}
          />
          <Text
            preset="title"
            style={{
              marginTop: 8,
              textAlign: "center",
            }}
          >
            {profile?.name || shortAddress(inboxId)}
          </Text>
          {profile?.name && (
            <Text
              preset="formLabel"
              style={{
                marginHorizontal: 20,
                textAlign: "center",
              }}
            >
              {profile.name || shortAddress(inboxId)}
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
  );
}
