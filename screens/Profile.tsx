import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  useColorScheme,
  Platform,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { showActionSheetWithOptions } from "../components/StateHandlers/ActionSheetStateHandler";
import TableView, {
  TableViewItemType,
} from "../components/TableView/TableView";
import {
  TableViewEmoji,
  TableViewImage,
  TableViewPicto,
} from "../components/TableView/TableViewImage";
import {
  currentAccount,
  useCurrentAccount,
  useProfilesStore,
  useRecommendationsStore,
  useSettingsStore,
} from "../data/store/accountsStore";
import { blockPeers, consentToPeers } from "../utils/api";
import {
  actionSheetColors,
  backgroundColor,
  dangerColor,
  primaryColor,
  textSecondaryColor,
} from "../utils/colors";
import { getIPFSAssetURI } from "../utils/thirdweb";
import { NavigationParamList } from "./Navigation/Navigation";

export default function ProfileScreen({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "Profile">) {
  const userAddress = useCurrentAccount();
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const [copiedAddresses, setCopiedAddresses] = useState<{
    [address: string]: boolean;
  }>({});
  const peerAddress = route.params.address;
  const recommendationTags = useRecommendationsStore(
    (s) => s.frens[peerAddress]?.tags
  );
  const profiles = useProfilesStore((state) => state.profiles);
  const isBlockedPeer = useSettingsStore(
    (s) => s.peersStatus[peerAddress.toLowerCase()] === "blocked"
  );
  const setPeersStatus = useSettingsStore((s) => s.setPeersStatus);
  const socials = profiles[peerAddress]?.socials;

  const insets = useSafeAreaInsets();

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
                Clipboard.setStringAsync(value);
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

  const addressItems = [
    ...getAddressItemsFromArray(socials?.ensNames || [], "name", "name"),
    ...getAddressItemsFromArray(
      socials?.unstoppableDomains || [],
      "domain",
      "domain"
    ),
    ...getAddressItemsFromArray(
      [{ title: peerAddress, address: peerAddress }],
      "title",
      "address"
    ),
  ];

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
      (l) => `Lens handle: ${l.handle}`,
      (l) => `https://lenster.xyz/u/${l.handle}`,
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

  return (
    <ScrollView
      style={styles.profile}
      contentContainerStyle={styles.profileContent}
    >
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
      {peerAddress.toLowerCase() !== userAddress?.toLowerCase() && (
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
  });
};
