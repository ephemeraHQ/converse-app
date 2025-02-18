import AndroidBackAction from "@/components/AndroidBackAction";
import { Avatar } from "@/components/Avatar";
import Button from "@/components/Button/Button";
import ActionButton from "@/components/Chat/ActionButton";
import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { config } from "@/config";
import { Text } from "@/design-system/Text";
import { useSafeCurrentSender } from "@/features/multi-inbox/multi-inbox.store";
import { useProfileQuery } from "@/features/profiles/profiles.query";
import { translate } from "@/i18n";
import { NavigationParamList } from "@/screens/Navigation/Navigation";
import { useHeaderHeight } from "@react-navigation/elements";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AvatarSizes } from "@styles/sizes";
import { useAppTheme } from "@theme/useAppTheme";
import { shortAddress } from "@utils/strings/shortAddress";
import React, { useEffect, useState } from "react";
import { Platform, Share, TouchableOpacity, View } from "react-native";
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

  const { avatar, name, description } = profile || {};

  const profileUrl = `https://${config.websiteDomain}/dm/${
    name || shortAddress(inboxId)
  }`;

  const shareDict =
    Platform.OS === "ios" ? { url: profileUrl } : { message: profileUrl };

  const shareButtonText = copiedLink
    ? translate("share_profile.link_copied")
    : translate("share_profile.copy_link");

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        Platform.OS === "ios" && (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ActionButton
              picto="xmark"
              style={{ width: 30, height: 30, marginTop: 10 }}
            />
          </TouchableOpacity>
        ),
      headerLeft: () =>
        Platform.OS !== "ios" && <AndroidBackAction navigation={navigation} />,
    });
  }, [navigation]);

  function handleShare() {
    Share.share(shareDict);
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
            uri={avatar}
            name={displayName}
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
            {displayName || username || shortAddress(userAddress)}
          </Text>
          {displayName !== username && (
            <Text
              preset="formLabel"
              style={{
                marginHorizontal: 20,
                textAlign: "center",
              }}
            >
              {username || shortAddress(userAddress)}
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
