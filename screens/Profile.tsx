import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import React, { useCallback, useContext, useState } from "react";
import {
  StyleSheet,
  ColorSchemeName,
  ScrollView,
  useColorScheme,
  Platform,
  TouchableOpacity,
} from "react-native";

import { showActionSheetWithOptions } from "../components/StateHandlers/ActionSheetStateHandler";
import TableView from "../components/TableView/TableView";
import {
  TableViewEmoji,
  TableViewImage,
  TableViewPicto,
} from "../components/TableView/TableViewImage";
import { AppContext } from "../data/deprecatedStore/context";
import { XmtpDispatchTypes } from "../data/deprecatedStore/xmtpReducer";
import { useProfilesStore } from "../data/store/accountsStore";
import { blockPeer } from "../utils/api";
import {
  actionSheetColors,
  backgroundColor,
  dangerColor,
  primaryColor,
  textSecondaryColor,
} from "../utils/colors";
import { shortAddress } from "../utils/str";
import { getIPFSAssetURI } from "../utils/thirdweb";
import { NavigationParamList } from "./Main";

export default function ProfileScreen({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "Profile">) {
  const { state, dispatch } = useContext(AppContext);
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const [copiedAddresses, setCopiedAddresses] = useState<{
    [address: string]: boolean;
  }>({});
  const peerAddress = route.params.address;
  const profiles = useProfilesStore((state) => state.profiles);
  const socials = profiles[peerAddress]?.socials;

  const getAddressItemsFromArray = useCallback(
    <T,>(array: T[], titleKey: string, valueKey: string) => {
      return array.map((e) => {
        const title = (e as any)[titleKey];
        const value = (e as any)[valueKey];
        return {
          id: title,
          title,
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
      });
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
      [{ shortAddress: shortAddress(peerAddress), address: peerAddress }],
      "shortAddress",
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
      });
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
  const isBlockedPeer =
    state.xmtp.blockedPeerAddresses[peerAddress.toLowerCase()];
  const recommendationTags = state.recommendations?.frens?.[peerAddress]?.tags;
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
      {peerAddress.toLowerCase() !== state.xmtp.address?.toLowerCase() && (
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
                  isBlockedPeer || Platform.OS === "android"
                    ? undefined
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
                      if (selectedIndex === 0) {
                        blockPeer({
                          peerAddress: peerAddress || "",
                          blocked: !isBlockedPeer,
                        });
                        dispatch({
                          type: XmtpDispatchTypes.XmtpSetBlockedStatus,
                          payload: {
                            peerAddress: peerAddress || "",
                            blocked: !isBlockedPeer,
                          },
                        });
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
    </ScrollView>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    profile: {
      backgroundColor: backgroundColor(colorScheme),
    },
    profileContent: {
      paddingHorizontal: Platform.OS === "ios" ? 18 : 0,
    },
    tableView: {},
  });
