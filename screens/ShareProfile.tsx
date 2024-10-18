import Clipboard from "@react-native-clipboard/clipboard";
import { useHeaderHeight } from "@react-navigation/elements";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import React, { useEffect, useState } from "react";
import {
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import AndroidBackAction from "../components/AndroidBackAction";
import Avatar from "../components/Avatar";
import ActionButton from "../components/Chat/ActionButton";
import Picto from "../components/Picto/Picto";
import config from "../config";
import {
  useCurrentAccount,
  useProfilesStore,
} from "../data/store/accountsStore";
import {
  BottomSheetContentContainer,
  BottomSheetHeader,
  BottomSheetModal,
  createBottomSheetModalRef,
} from "../design-system/BottomSheet/BottomSheetModal";
import { Button } from "../design-system/Button/Button";
import { spacing } from "../theme";
import { isDesktop } from "../utils/device";
import {
  getPreferredAvatar,
  getPreferredName,
  getPreferredUsername,
  getProfile,
} from "../utils/profile";
import { shortAddress } from "../utils/str";
import { NavigationParamList } from "./Navigation/Navigation";

const ShareProfileContent = ({
  userAddress,
  username,
  displayName,
  avatar,
  profileUrl,
  compact = false,
}: {
  userAddress: string;
  username?: string;
  displayName: string;
  avatar: string;
  profileUrl: string;
  compact?: boolean;
}) => {
  const colorScheme = useColorScheme();
  const headerHeight = useHeaderHeight();
  const styles = useStyles();
  const [copiedLink, setCopiedLink] = useState(false);

  const shareDict =
    Platform.OS === "ios" && !isDesktop
      ? { url: profileUrl }
      : { message: profileUrl };

  const shareButtonText =
    Platform.OS === "web"
      ? copiedLink
        ? "Link copied"
        : "Copy link"
      : "Share link";

  const handleShare = () => {
    console.log("bottomSheetModalRef.current:", bottomSheetModalRef.current);
    bottomSheetModalRef.current?.present();
    return;

    if (Platform.OS === "web") {
      setCopiedLink(true);
      Clipboard.setString(profileUrl);
      setTimeout(() => {
        setCopiedLink(false);
      }, 1000);
    } else {
      Share.share(shareDict);
    }
  };

  return (
    <>
      <View style={compact ? styles.shareProfileCompact : styles.shareProfile}>
        <View style={styles.shareProfileContent}>
          <Avatar
            uri={avatar}
            name={displayName}
            size={
              compact
                ? AvatarSizes.shareProfileCompact
                : AvatarSizes.shareProfile
            }
            style={styles.avatar}
          />
          <Text style={[styles.identity, compact && styles.identityCompact]}>
            {displayName || username || shortAddress(userAddress || "")}
          </Text>
          {displayName !== username && (
            <Text style={styles.username}>
              {username || shortAddress(userAddress || "")}
            </Text>
          )}
          {username && (
            <Text style={styles.address}>
              {shortAddress(userAddress || "")}
            </Text>
          )}
        </View>
        <View style={[styles.qrCode, compact && styles.qrCodeCompact]}>
          <QRCode
            size={compact ? 200 : 220}
            value={profileUrl}
            backgroundColor={backgroundColor(colorScheme)}
            color={textPrimaryColor(colorScheme)}
          />
        </View>
        <View
          style={[
            styles.shareButtonContainer,
            compact && styles.shareButtonContainerCompact,
          ]}
        >
          {!compact ? (
            <Button
              action="primary"
              style={{
                width: "100%",
              }}
              title={shareButtonText}
              picto={
                Platform.OS === "web"
                  ? copiedLink
                    ? "checkmark"
                    : "doc.on.doc"
                  : "square.and.arrow.up"
              }
              onPress={handleShare}
            />
          ) : (
            <TouchableOpacity
              onPress={handleShare}
              style={styles.shareButtonCompact}
            >
              <Picto
                picto="square.and.arrow.up"
                style={styles.shareButtonIconCompact}
                size={Platform.OS === "android" ? 16 : 12}
              />
              <Text style={styles.shareButtonTextCompact}>
                {shareButtonText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {!compact && <View style={{ height: headerHeight }} />}
      </View>
    </>
  );
};

export { ShareProfileContent };

const bottomSheetModalRef = createBottomSheetModalRef();

export default function ShareProfileScreen({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "ShareProfile">) {
  const userAddress = useCurrentAccount() as string;
  const socials = useProfilesStore(
    (s) => getProfile(userAddress, s.profiles)?.socials
  );
  const username = getPreferredUsername(socials);
  const displayName = getPreferredName(socials, userAddress);
  const avatar = getPreferredAvatar(socials);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        Platform.OS === "ios" && (
          <TouchableOpacity
            onPress={() => {
              navigation.goBack();
            }}
          >
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

  const profileUrl = `https://${config.websiteDomain}/dm/${
    username || userAddress
  }`;

  return (
    <>
      <ShareProfileContent
        userAddress={userAddress}
        username={username}
        displayName={displayName}
        avatar={avatar || ""}
        profileUrl={profileUrl}
      />

      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={["50%"]}
        index={1}
      >
        <BottomSheetContentContainer>
          <BottomSheetHeader title="Share profile" hasClose />
        </BottomSheetContentContainer>
      </BottomSheetModal>
    </>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    shareProfile: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
    },
    shareProfileCompact: {
      flex: 0,
    },
    shareProfileContent: {
      alignItems: "center",
    },
    avatar: {
      alignSelf: "center",
    },
    qrCode: {
      alignSelf: "center",
      justifyContent: "center",
      marginTop: 40,
    },
    qrCodeCompact: {
      marginTop: 20,
    },
    identity: {
      color: textPrimaryColor(colorScheme),
      fontSize: 25,
      fontWeight: "600",
      textAlign: "center",
      marginTop: 8,
    },
    identityCompact: {
      fontSize: 20,
    },
    username: {
      fontSize: 15,
      lineHeight: 22,
      color: textSecondaryColor(colorScheme),
      marginHorizontal: 20,
      textAlign: "center",
    },
    address: {
      fontSize: 15,
      lineHeight: 22,
      color: textSecondaryColor(colorScheme),
      marginHorizontal: 20,
      textAlign: "center",
    },
    shareButtonContainer: {
      flex: 1,
      justifyContent: "flex-end",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
    },
    shareButtonContainerCompact: {
      flex: 0,
    },
    shareButtonIconCompact: {
      marginRight: 8,
      width: 16,
      height: 16,
      top: Platform.OS === "android" ? 2 : 0,
    },
    shareButtonCompact: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      marginTop: 4,
    },
    shareButtonTextCompact: {
      color: textPrimaryColor(colorScheme),
      fontSize: 15,
      marginTop: 4,
    },
  });
};
