import { usePrivy } from "@privy-io/expo";
import Clipboard from "@react-native-clipboard/clipboard";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useDisconnect } from "@thirdweb-dev/react-native";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  useColorScheme,
  Platform,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ActivityIndicator from "../components/ActivityIndicator/ActivityIndicator";
import { addLog } from "../components/DebugButton";
import { showActionSheetWithOptions } from "../components/StateHandlers/ActionSheetStateHandler";
import TableView, {
  TableViewItemType,
} from "../components/TableView/TableView";
import {
  TableViewEmoji,
  TableViewImage,
  TableViewPicto,
} from "../components/TableView/TableViewImage";
import config from "../config";
import {
  currentAccount,
  useCurrentAccount,
  useLoggedWithPrivy,
  useProfilesStore,
  useRecommendationsStore,
  useSettingsStore,
  useWalletStore,
} from "../data/store/accountsStore";
import { blockPeers, consentToPeers } from "../utils/api";
import {
  actionSheetColors,
  backgroundColor,
  dangerColor,
  primaryColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
import { evmHelpers } from "../utils/evm/helpers";
import { logout } from "../utils/logout";
import { pick } from "../utils/objects";
import { getIPFSAssetURI } from "../utils/thirdweb";
import { refreshBalanceForAccount } from "../utils/wallet";
import { NavigationParamList } from "./Navigation/Navigation";

export default function ProfileScreen({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "Profile">) {
  const userAddress = useCurrentAccount() as string;
  const { USDCBalance } = useWalletStore((s) => pick(s, ["USDCBalance"]));
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const [copiedAddresses, setCopiedAddresses] = useState<{
    [address: string]: boolean;
  }>({});
  const peerAddress = route.params.address;
  const recommendationTags = useRecommendationsStore(
    (s) => s.frens[peerAddress]?.tags
  );
  const disconnectWallet = useDisconnect();
  const profiles = useProfilesStore((state) => state.profiles);
  const isBlockedPeer = useSettingsStore(
    (s) => s.peersStatus[peerAddress.toLowerCase()] === "blocked"
  );
  const setPeersStatus = useSettingsStore((s) => s.setPeersStatus);
  const socials = profiles[peerAddress]?.socials;

  const insets = useSafeAreaInsets();
  useEffect(() => {
    refreshBalanceForAccount(userAddress);
  }, [userAddress]);

  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const manuallyRefreshBalance = useCallback(async () => {
    setRefreshingBalance(true);
    const now = new Date().getTime();
    await refreshBalanceForAccount(userAddress);
    const after = new Date().getTime();
    if (after - now < 1000) {
      await new Promise((r) => setTimeout(r, 1000 - after + now));
    }
    setRefreshingBalance(false);
  }, [userAddress]);

  const getAddressItemsFromArray = useCallback(
    <T,>(array: T[], titleKey: string, valueKey: string) => {
      return array.map((e) => {
        const title = (e as any)[titleKey];
        const value = (e as any)[valueKey];
        return {
          id: title,
          title,
          titleNumberOfLines: 2,
          rightView: (
            <TouchableOpacity
              onPress={() => {
                setCopiedAddresses((c) => ({ ...c, [title]: true }));
                Clipboard.setString(value);
                setTimeout(() => {
                  setCopiedAddresses((c) => ({ ...c, [title]: false }));
                }, 1000);
              }}
            >
              <TableViewPicto
                symbol={copiedAddresses[title] ? "checkmark" : "doc.on.doc"}
                color={
                  Platform.OS === "android"
                    ? primaryColor(colorScheme)
                    : undefined
                }
              />
            </TouchableOpacity>
          ),
        };
      }) as TableViewItemType[];
    },
    [colorScheme, copiedAddresses]
  );

  const usernamesItems = [
    ...getAddressItemsFromArray(socials?.userNames || [], "name", "name"),
    ...getAddressItemsFromArray(socials?.ensNames || [], "name", "name"),
    ...getAddressItemsFromArray(
      socials?.unstoppableDomains || [],
      "domain",
      "domain"
    ),
  ];

  const addressItems = [
    ...getAddressItemsFromArray(
      [{ title: peerAddress, address: peerAddress }],
      "title",
      "address"
    ),
  ];

  const isPrivy = useLoggedWithPrivy();
  const { logout: privyLogout } = usePrivy();

  const getSocialItemsFromArray = useCallback(
    <T,>(
      array: T[],
      getId: (e: T) => string,
      getTitle: (e: T) => string,
      getSubtitle: (e: T) => string,
      getLink: (e: T) => string,
      getImageURI: (e: T) => string | undefined
    ) => {
      if (!array) return [];
      return array.map((e: T) => {
        const imageURI = getImageURI(e);
        return {
          id: getId(e),
          title: getTitle(e),
          subtitle: getSubtitle(e),
          action: () => {
            Linking.openURL(getLink(e));
          },
          leftView: imageURI ? (
            <TableViewImage imageURI={getIPFSAssetURI(imageURI)} />
          ) : (
            <TableViewEmoji
              emoji="👋"
              style={{
                backgroundColor: "rgba(118, 118, 128, 0.12)",
                borderRadius: 30,
              }}
            />
          ),
          rightView: (
            <TableViewPicto
              symbol="chevron.right"
              color={textSecondaryColor(colorScheme)}
            />
          ),
        };
      }) as TableViewItemType[];
    },
    [colorScheme]
  );

  const socialItems = [
    ...getSocialItemsFromArray(
      socials?.lensHandles || [],
      (l) => `lens-${l.handle}`,
      (l) => l.name || l.handle,
      (l) => `Lens handle: ${l.handle.replace(/\.lens$/, "")}`,
      (l) => `https://hey.xyz/u/${l.handle.replace(/\.lens$/, "")}`,
      (l) => l.profilePictureURI
    ),
    ...getSocialItemsFromArray(
      socials?.farcasterUsernames || [],
      (f) => `fc-${f.username}`,
      (f) => f.name || `${f.username}.fc`,
      (f) => `Farcaster id: ${f.username}.fc`,
      (f) => `https://warpcast.com/${f.username}`,
      (f) => f.avatarURI
    ),
  ];

  const isMyProfile = peerAddress.toLowerCase() === userAddress?.toLowerCase();
  const appVersion = Constants.expoConfig?.version;
  const buildNumber =
    Platform.OS === "ios"
      ? Constants.expoConfig?.ios?.buildNumber
      : Constants.expoConfig?.android?.versionCode;

  return (
    <ScrollView
      style={styles.profile}
      contentContainerStyle={styles.profileContent}
    >
      {isMyProfile && (
        <TableView
          items={[
            {
              id: "qrCode",
              title: "Invite more friends",
              rightView: (
                <TableViewPicto
                  symbol="qrcode"
                  color={
                    Platform.OS === "android"
                      ? primaryColor(colorScheme)
                      : undefined
                  }
                  onPress={() => {
                    navigation.navigate("ShareProfile");
                  }}
                />
              ),
            },
          ]}
          title="YOU'RE THE OG"
          style={styles.tableView}
        />
      )}
      {isMyProfile && (
        <TableView
          items={[
            {
              id: "balance",
              title: "Your balance (USDC)",
              rightView: (
                <View style={styles.balanceContainer}>
                  <Text style={styles.balance}>
                    $
                    {evmHelpers.fromDecimal(
                      USDCBalance,
                      config.evm.USDC.decimals,
                      2
                    )}
                  </Text>
                  <View style={{ width: 30 }}>
                    {!refreshingBalance && (
                      <View style={{ left: Platform.OS === "ios" ? 0 : -14 }}>
                        <TableViewPicto
                          symbol="arrow.clockwise"
                          color={
                            Platform.OS === "android"
                              ? primaryColor(colorScheme)
                              : undefined
                          }
                          onPress={manuallyRefreshBalance}
                        />
                      </View>
                    )}
                    {refreshingBalance && <ActivityIndicator />}
                  </View>
                </View>
              ),
            },
            {
              id: "topUp",
              title: "Top up your account",
              action: () => {
                navigation.push("TopUp");
              },
              rightView: (
                <TableViewPicto
                  symbol="chevron.right"
                  color={textSecondaryColor(colorScheme)}
                />
              ),
            },
          ]}
          title="BALANCE"
          style={styles.tableView}
        />
      )}

      {usernamesItems.length > 0 && (
        <TableView
          items={usernamesItems}
          title={`USERNAME${usernamesItems.length > 1 ? "S" : ""}`}
          style={styles.tableView}
        />
      )}

      <TableView
        items={addressItems}
        title="ADDRESS"
        style={styles.tableView}
      />

      {socialItems.length > 0 && (
        <TableView
          items={socialItems}
          title="SOCIAL"
          style={styles.tableView}
        />
      )}
      {!isMyProfile && (
        <>
          {recommendationTags?.length && (
            <TableView
              items={recommendationTags.map((t) => ({
                id: t.text,
                title: t.text,
                titleNumberOfLines: 3,
                leftView: <TableViewImage imageURI={t.image} />,
              }))}
              title="COMMON ACTIVITY"
              style={styles.tableView}
            />
          )}
          <TableView
            items={[
              {
                id: "block",
                title: isBlockedPeer ? "Unblock" : "Block",
                titleColor:
                  Platform.OS === "android"
                    ? undefined
                    : isBlockedPeer
                    ? primaryColor(colorScheme)
                    : dangerColor(colorScheme),
                leftView:
                  Platform.OS === "android" ? (
                    <TableViewPicto
                      symbol="block"
                      color={textSecondaryColor(colorScheme)}
                    />
                  ) : undefined,
                action: () => {
                  showActionSheetWithOptions(
                    {
                      options: [isBlockedPeer ? "Unblock" : "Block", "Cancel"],
                      cancelButtonIndex: 1,
                      destructiveButtonIndex: isBlockedPeer ? undefined : 0,
                      title: isBlockedPeer
                        ? "If you unblock this contact, they will be able to send you messages again."
                        : "If you block this contact, you will not receive messages from them anymore.",
                      ...actionSheetColors(colorScheme),
                    },
                    (selectedIndex?: number) => {
                      if (selectedIndex === 0 && peerAddress) {
                        const newStatus = isBlockedPeer
                          ? "consented"
                          : "blocked";
                        const actionFunc = isBlockedPeer
                          ? consentToPeers
                          : blockPeers;

                        actionFunc(currentAccount(), [peerAddress]);
                        setPeersStatus({ [peerAddress]: newStatus });
                        // Pop to conversation list, antepenultimate screen in stack
                        navigation.pop(2);
                      }
                    }
                  );
                },
              },
            ]}
            title="ACTIONS"
            style={styles.tableView}
          />
        </>
      )}
      {isMyProfile && (
        <>
          <TableView
            items={[
              {
                id: "contact",
                title: "Contact Converse Team",
                action: () => {
                  navigation.pop();
                  setTimeout(() => {
                    navigation.push("Conversation", {
                      mainConversationWithPeer: config.polAddress,
                    });
                  }, 300);
                },
                titleColor:
                  Platform.OS === "android"
                    ? undefined
                    : primaryColor(colorScheme),
              },
              {
                id: "logout",
                title: "Disconnect",
                titleColor:
                  Platform.OS === "android"
                    ? undefined
                    : dangerColor(colorScheme),
                action: () => {
                  navigation.popToTop();
                  setTimeout(() => {
                    disconnectWallet();
                    if (isPrivy) {
                      addLog("calling privy logout from Profile.tsx");
                      privyLogout();
                    }
                    logout(userAddress);
                  }, 300);
                },
              },
            ]}
            title="ACTIONS"
            style={styles.tableView}
          />
          <TableView
            items={[
              {
                id: "version",
                title: `v${appVersion} (${buildNumber}) - built in Paris with ❤️`,
              },
            ]}
            title="APP VERSION"
            style={styles.tableView}
          />
        </>
      )}
      <View style={{ height: insets.bottom }} />
    </ScrollView>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    profile: {
      backgroundColor: backgroundColor(colorScheme),
    },
    profileContent: {
      paddingHorizontal: Platform.OS === "ios" ? 18 : 0,
    },
    tableView: {},
    balanceContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    balance: {
      color: textPrimaryColor(colorScheme),
      fontSize: 17,
      marginRight: 10,
    },
  });
};
