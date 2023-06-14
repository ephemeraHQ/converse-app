import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import React, { useContext, useState } from "react";
import {
  StyleSheet,
  ColorSchemeName,
  ScrollView,
  useColorScheme,
  Platform,
} from "react-native";

import { showActionSheetWithOptions } from "../components/StateHandlers/ActionSheetStateHandler";
import TableView from "../components/TableView/TableView";
import {
  TableViewEmoji,
  TableViewImage,
  TableViewPicto,
} from "../components/TableView/TableViewImage";
import { AppContext } from "../data/store/context";
import { XmtpDispatchTypes } from "../data/store/xmtpReducer";
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
  const socials = state.profiles[peerAddress]?.socials;
  const addressItems = [
    ...(!socials?.ensNames
      ? []
      : socials.ensNames.map((e) => ({
          id: e.name,
          title: e.name,
          rightView: (
            <TableViewPicto
              symbol={copiedAddresses[e.name] ? "checkmark" : "doc.on.doc"}
              color={
                Platform.OS === "android"
                  ? primaryColor(colorScheme)
                  : undefined
              }
            />
          ),
          action: () => {
            setCopiedAddresses((c) => ({ ...c, [e.name]: true }));
            Clipboard.setStringAsync(e.name);
            setTimeout(() => {
              setCopiedAddresses((c) => ({ ...c, [e.name]: false }));
            }, 1000);
          },
        }))),
    {
      id: "address",
      title: shortAddress(peerAddress),
      rightView: (
        <TableViewPicto
          symbol={copiedAddresses["address"] ? "checkmark" : "doc.on.doc"}
          color={
            Platform.OS === "android" ? primaryColor(colorScheme) : undefined
          }
        />
      ),
      action: () => {
        setCopiedAddresses((c) => ({ ...c, address: true }));
        Clipboard.setStringAsync(peerAddress);
        setTimeout(() => {
          setCopiedAddresses((c) => ({ ...c, address: false }));
        }, 1000);
      },
    },
  ];
  const socialItems = [
    ...(!socials?.lensHandles
      ? []
      : socials.lensHandles.map((l) => ({
          id: l.handle,
          title: l.name || l.handle,
          subtitle: `Lens handle: ${l.handle}`,
          action: () => {
            Linking.openURL(`https://lenster.xyz/u/${l.handle}`);
          },
          leftView: l.profilePictureURI ? (
            <TableViewImage imageURI={getIPFSAssetURI(l.profilePictureURI)} />
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
        }))),
    ...(!socials?.farcasterUsernames
      ? []
      : socials.farcasterUsernames.map((f) => ({
          id: f.username,
          title: f.name || `${f.username}.fc`,
          subtitle: `Farcaster id: ${f.username}.fc`,
          action: () => {
            Linking.openURL(`https://warpcast.com/${f.username}`);
          },
          leftView: f.avatarURI ? (
            <TableViewImage imageURI={getIPFSAssetURI(f.avatarURI)} />
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
        }))),
  ];
  const isBlockedPeer =
    state.xmtp.blockedPeerAddresses[peerAddress.toLowerCase()];
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
