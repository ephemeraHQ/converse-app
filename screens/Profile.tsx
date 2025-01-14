import { useDisconnectActionSheet } from "@hooks/useDisconnectActionSheet";
import { useShouldShowErrored } from "@hooks/useShouldShowErrored";
import { translate } from "@i18n";
import { useRoute, useRouter } from "@navigation/useNavigation";
import Clipboard from "@react-native-clipboard/clipboard";
import { StackActions } from "@react-navigation/native";
import {
  actionSheetColors,
  backgroundColor,
  dangerColor,
  primaryColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { PictoSizes } from "@styles/sizes";
import { usePrivySigner } from "@utils/evm/privy";
import { useXmtpSigner } from "@utils/evm/xmtp";
import { memberCanUpdateGroup } from "@utils/groupUtils/memberCanUpdateGroup";
import { sentryTrackError } from "@utils/sentry";
import { shortAddress } from "@utils/strings/shortAddress";
import { ConverseXmtpClientType } from "@/utils/xmtpRN/client.types";
import {
  getOtherInstallations,
  revokeOtherInstallations,
} from "@utils/xmtpRN/revoke";
import { getXmtpClient } from "@utils/xmtpRN/sync";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ActivityIndicator from "../components/ActivityIndicator/ActivityIndicator";
import { Avatar } from "../components/Avatar";
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
  useRecommendationsStore,
  useSettingsStore,
  useWalletStore,
} from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { useSelect } from "../data/store/storeHelpers";
import { ExternalWalletPicker } from "../features/ExternalWalletPicker/ExternalWalletPicker";
import { ExternalWalletPickerContextProvider } from "../features/ExternalWalletPicker/ExternalWalletPicker.context";
import { useGroupMembers } from "../hooks/useGroupMembers";
import { useGroupPermissions } from "../hooks/useGroupPermissions";
import { evmHelpers } from "../utils/evm/helpers";
import {
  getAddressIsAdmin,
  getAddressIsSuperAdmin,
} from "../utils/groupUtils/adminUtils";
import { ConversationNavParams } from "../features/conversation/conversation.nav";

import { getPreferredUsername } from "@utils/profile/getPreferredUsername";
import { getIPFSAssetURI } from "../utils/thirdweb";
import { refreshBalanceForAccount } from "../utils/wallet";
import { consentToAddressesOnProtocolByAccount } from "../utils/xmtpRN/contacts";

import { Icon } from "@/design-system/Icon/Icon";
import { NotificationPermissionStatus } from "@/features/notifications/types/Notifications.types";
import { requestPushNotificationsPermissions } from "@/features/notifications/utils/requestPushNotificationsPermissions";
import { useCurrentAccountXmtpClient } from "@/hooks/useCurrentAccountXmtpClient";
import { usePreferredAvatarUri } from "@/hooks/usePreferredAvatarUri";
import { usePreferredName } from "@/hooks/usePreferredName";
import { useProfileSocials } from "@/hooks/useProfileSocials";

export default function ProfileScreen() {
  return (
    <ExternalWalletPickerContextProvider>
      <ProfileScreenImpl />
      <ExternalWalletPickerWrapper />
    </ExternalWalletPickerContextProvider>
  );
}

const ExternalWalletPickerWrapper = memo(
  function ExternalWalletPickerWrapper() {
    const peerAddress = useRoute<"Profile">().params.address;
    const { data: socials } = useProfileSocials(peerAddress);
    const { data: client } = useCurrentAccountXmtpClient();

    return (
      <ExternalWalletPicker
        title={translate("revoke_wallet_picker_title")}
        subtitle={translate("revoke_wallet_picker_description", {
          wallet: socials
            ? getPreferredUsername(socials)
            : client
              ? shortAddress(client.address)
              : "",
        })}
      />
    );
  }
);

function ProfileScreenImpl() {
  const navigation = useRouter();
  const route = useRoute<"Profile">();

  const userAddress = useCurrentAccount() as string;
  const USDCBalance = useWalletStore((s) => s.USDCBalance);
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const [copiedAddresses, setCopiedAddresses] = useState<{
    [address: string]: boolean;
  }>({});
  const peerAddress = route.params.address;
  const recommendationTags = useRecommendationsStore(
    (s) => s.frens[peerAddress]?.tags
  );
  const isBlockedPeer = useSettingsStore(
    (s) => s.peersStatus[peerAddress.toLowerCase()] === "blocked"
  );
  const setPeersStatus = useSettingsStore((s) => s.setPeersStatus);
  const { data: socials } = useProfileSocials(peerAddress);
  const preferredUserName = usePreferredName(peerAddress);
  const preferredAvatarUri = usePreferredAvatarUri(peerAddress);
  const groupTopic = route.params.fromGroupTopic;
  const {
    members: groupMembers,
    removeMember,
    revokeAdmin,
    revokeSuperAdmin,
    promoteToAdmin,
    promoteToSuperAdmin,
  } = useGroupMembers(groupTopic!);
  const { permissions: groupPermissions } = useGroupPermissions(groupTopic!);

  const { getXmtpSigner } = useXmtpSigner();
  const privySigner = usePrivySigner();

  const insets = useSafeAreaInsets();
  const shouldShowError = useShouldShowErrored();
  useEffect(() => {
    refreshBalanceForAccount(userAddress);
  }, [userAddress]);

  const [refreshingBalance, setRefreshingBalance] = useState(false);

  const manuallyRefreshBalance = useCallback(async () => {
    setRefreshingBalance(true);
    const now = new Date().getTime();
    await refreshBalanceForAccount(userAddress, 0);
    const after = new Date().getTime();
    if (after - now < 1000) {
      await new Promise((r) => setTimeout(r, 1000 - after + now));
    }
    setRefreshingBalance(false);
  }, [userAddress]);

  const { setNotificationsPermissionStatus, notificationsPermissionStatus } =
    useAppStore(
      useSelect([
        "setNotificationsPermissionStatus",
        "notificationsPermissionStatus",
      ])
    );

  const getAddressItemsFromArray = useCallback(
    <T,>(array: T[], titleKey: string, valueKey: string) => {
      return array.map((e) => {
        const title = (e as any)[titleKey];
        const value = (e as any)[valueKey];
        const handleCopyAddress = () => {
          setCopiedAddresses((c) => ({ ...c, [title]: true }));
          Clipboard.setString(value);
          setTimeout(() => {
            setCopiedAddresses((c) => ({ ...c, [title]: false }));
          }, 1000);
        };
        return {
          id: title,
          title,
          titleNumberOfLines: 2,
          rightView: (
            <TouchableOpacity onPress={handleCopyAddress}>
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
      (socials?.unstoppableDomains || []).filter(
        (d) => !d.domain.toLowerCase().endsWith(".eth")
      ),
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
  const showDisconnectActionSheet = useDisconnectActionSheet();

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
            <TableViewEmoji emoji="👋" style={styles.emoji} />
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
    [colorScheme, styles.emoji]
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
      (f) => f.name || f.username,
      (f) => `Farcaster id: ${f.username}`,
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
  const balanceItems: TableViewItemType[] = [
    {
      id: "balance",
      title: translate("your_balance_usdc"),
      rightView: (
        <View style={styles.balanceContainer}>
          <Text style={styles.balance}>
            ${evmHelpers.fromDecimal(USDCBalance, config.evm.USDC.decimals, 2)}
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
  ];

  if (isPrivy) {
    balanceItems.push({
      id: "topUp",
      title: translate("top_up_your_account"),
      action: () => {
        navigation.push("TopUp");
      },
      rightView: (
        <TableViewPicto
          symbol="chevron.right"
          color={textSecondaryColor(colorScheme)}
        />
      ),
    });
  }

  const actionsTableViewItems = useMemo(() => {
    const items: TableViewItemType[] = [];
    if (!isBlockedPeer) {
      items.push({
        id: "message",
        title: translate("send_a_message"),
        titleColor: primaryColor(colorScheme),
        action: () => {
          setTimeout(() => {
            const isPreviouslyInNavStack = navigation
              .getState()
              .routes.some((route) => {
                if (route.name !== "Conversation") {
                  return false;
                }
                const params = route.params as ConversationNavParams;
                return params?.peer === peerAddress.toLowerCase();
              });
            if (isPreviouslyInNavStack) {
              navigation.popToTop();
              navigation.navigate({
                name: "Conversation",
                params: {
                  peer: peerAddress,
                },
              });
            } else {
              navigation.popToTop();
              navigation.dispatch(
                StackActions.push("Conversation", {
                  peer: peerAddress,
                })
              );
            }
          }, 300);
        },
        leftView:
          Platform.OS === "android" ? (
            <TableViewPicto
              symbol="message"
              color={primaryColor(colorScheme)}
            />
          ) : undefined,
      });
    }

    items.push({
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
            options: [
              isBlockedPeer ? translate("unblock") : translate("block"),
              translate("cancel"),
            ],
            cancelButtonIndex: 1,
            destructiveButtonIndex: isBlockedPeer ? undefined : 0,
            title: isBlockedPeer
              ? translate("if_you_unblock_contact")
              : translate("if_you_block_contact"),
            ...actionSheetColors(colorScheme),
          },
          (selectedIndex?: number) => {
            if (selectedIndex === 0 && peerAddress) {
              const newStatus = isBlockedPeer ? "consented" : "blocked";
              const consentOnProtocol = isBlockedPeer ? "allow" : "deny";
              consentToAddressesOnProtocolByAccount({
                account: currentAccount(),
                addresses: [peerAddress],
                consent: consentOnProtocol,
              });
              setPeersStatus({ [peerAddress]: newStatus });

              // Pop to conversation list, antepenultimate screen in stack
              navigation.pop(2);
            }
          }
        );
      },
    });

    if (!groupTopic || !groupMembers) {
      return items;
    }
    const peerId = groupMembers.byAddress[peerAddress];
    if (!peerId) {
      return items;
    }
    const currentAccountIsAdmin = getAddressIsAdmin(groupMembers, userAddress);
    const currentAccountIsSuperAdmin = getAddressIsSuperAdmin(
      groupMembers,
      userAddress
    );
    const peerIsAdmin = getAddressIsAdmin(groupMembers, peerAddress);
    const peerIsSuperAdmin = getAddressIsSuperAdmin(groupMembers, peerAddress);
    if (
      memberCanUpdateGroup(
        groupPermissions?.removeMemberPolicy,
        currentAccountIsAdmin,
        currentAccountIsSuperAdmin
      ) &&
      !peerIsSuperAdmin
    ) {
      items.push({
        id: "remove",
        title: translate("remove_from_group"),
        titleColor:
          Platform.OS === "android" ? undefined : dangerColor(colorScheme),
        action: () => {
          showActionSheetWithOptions(
            {
              options: [translate("remove_from_group"), translate("cancel")],
              cancelButtonIndex: 1,
              destructiveButtonIndex: 0,
              title: translate("are_you_sure"),
              ...actionSheetColors(colorScheme),
            },
            async (selectedIndex?: number) => {
              if (selectedIndex === 0 && peerId) {
                await removeMember([peerId]);
              }
            }
          );
        },
      });
    }

    if (
      !peerIsAdmin &&
      memberCanUpdateGroup(
        groupPermissions?.addAdminPolicy,
        currentAccountIsAdmin,
        currentAccountIsSuperAdmin
      )
    ) {
      items.unshift({
        id: "promote",
        title: translate("promote_to_admin"),
        titleColor:
          Platform.OS === "android" ? undefined : primaryColor(colorScheme),
        action: () => {
          showActionSheetWithOptions(
            {
              options: [translate("promote_to_admin"), "Cancel"],
              cancelButtonIndex: 1,
              destructiveButtonIndex: undefined,
              title: translate("are_you_sure"),
              ...actionSheetColors(colorScheme),
            },
            async (selectedIndex?: number) => {
              if (selectedIndex === 0 && peerId) {
                await promoteToAdmin(peerId);
              }
            }
          );
        },
      });
    }

    if (currentAccountIsSuperAdmin && !peerIsSuperAdmin) {
      items.unshift({
        id: "promoteToSuperAdmin",
        title: translate("promote_to_super_admin"),
        titleColor:
          Platform.OS === "android" ? undefined : primaryColor(colorScheme),
        action: () => {
          showActionSheetWithOptions(
            {
              options: [
                translate("promote_to_super_admin"),
                translate("cancel"),
              ],
              cancelButtonIndex: 1,
              destructiveButtonIndex: undefined,
              title: translate("are_you_sure"),
              ...actionSheetColors(colorScheme),
            },
            async (selectedIndex?: number) => {
              if (selectedIndex === 0 && peerId) {
                await promoteToSuperAdmin(peerId);
              }
            }
          );
        },
      });
    }
    if (currentAccountIsSuperAdmin && peerIsSuperAdmin) {
      items.push({
        id: "revokeSuperAdmin",
        title: translate("revoke_super_admin"),
        titleColor:
          Platform.OS === "android" ? undefined : dangerColor(colorScheme),
        action: () => {
          showActionSheetWithOptions(
            {
              options: [translate("revoke_super_admin"), translate("cancel")],
              cancelButtonIndex: 1,
              destructiveButtonIndex: 0,
              title: translate("are_you_sure"),
              ...actionSheetColors(colorScheme),
            },
            async (selectedIndex?: number) => {
              if (selectedIndex === 0 && peerId) {
                await revokeSuperAdmin(peerId);
              }
            }
          );
        },
      });
    }

    if (
      peerIsAdmin &&
      memberCanUpdateGroup(
        groupPermissions?.removeAdminPolicy,
        currentAccountIsAdmin,
        currentAccountIsSuperAdmin
      )
    ) {
      items.push({
        id: "revokeAdmin",
        title: translate("revoke_admin"),
        titleColor:
          Platform.OS === "android" ? undefined : dangerColor(colorScheme),
        action: () => {
          showActionSheetWithOptions(
            {
              options: [translate("revoke_admin"), translate("cancel")],
              cancelButtonIndex: 1,
              destructiveButtonIndex: 0,
              title: translate("are_you_sure"),
              ...actionSheetColors(colorScheme),
            },
            async (selectedIndex?: number) => {
              if (selectedIndex === 0 && peerAddress) {
                await revokeAdmin(peerId);
              }
            }
          );
        },
      });
    }

    return items;
  }, [
    isBlockedPeer,
    colorScheme,
    groupTopic,
    groupMembers,
    peerAddress,
    userAddress,
    groupPermissions?.removeMemberPolicy,
    groupPermissions?.addAdminPolicy,
    groupPermissions?.removeAdminPolicy,
    setPeersStatus,
    navigation,
    removeMember,
    promoteToAdmin,
    promoteToSuperAdmin,
    revokeSuperAdmin,
    revokeAdmin,
  ]);

  return (
    <ScrollView
      style={styles.profile}
      contentContainerStyle={styles.profileContent}
    >
      <Avatar
        uri={preferredAvatarUri ?? undefined}
        style={styles.avatar}
        name={preferredUserName}
      />
      <Text style={styles.title}>{preferredUserName}</Text>
      {isMyProfile && shouldShowError && (
        <View style={styles.errorContainer}>
          <Icon
            icon="exclamationmark.triangle"
            color={dangerColor(colorScheme)}
            size={PictoSizes.textButton}
            style={styles.errorIcon}
          />
          <Text style={styles.errorText}>{translate("client_error")}</Text>
        </View>
      )}
      {isMyProfile && (
        <TableView
          items={[
            {
              id: "qrCode",
              title: translate("invite_more_friends"),
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
          title={translate("youre_the_og")}
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
        title={translate("address")}
        style={styles.tableView}
      />

      {route.params?.fromGroupTopic && !isMyProfile && (
        <TableView
          items={[
            {
              id: "message",
              title: translate("send_a_message"),
              titleColor: primaryColor(colorScheme),
              action: () => {
                navigation.pop(3);
                // @todo => check if this is the right timing on split screen / web / android
                setTimeout(() => {
                  navigation.navigate("Conversation", {
                    peer: route.params.address,
                  });
                }, 300);
              },
            },
          ]}
          style={styles.tableView}
        />
      )}

      {socialItems.length > 0 && (
        <TableView
          items={socialItems}
          title={translate("social")}
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
              title={translate("common_activity")}
              style={styles.tableView}
            />
          )}
          <TableView
            items={actionsTableViewItems}
            title={translate("actions")}
            style={styles.tableView}
          />
        </>
      )}
      {isMyProfile && (
        <>
          <TableView
            items={[
              {
                id: "blocked",
                title: translate("view_removed_chats"),
                action: () => {
                  navigation.popToTop();
                  navigation.navigate("Blocked");
                },
                titleColor:
                  Platform.OS === "android"
                    ? undefined
                    : primaryColor(colorScheme),
              },
              {
                id: "accounts",
                title: translate("change_or_add_account"),
                action: () => {
                  navigation.push("Accounts");
                },
                titleColor:
                  Platform.OS === "android"
                    ? undefined
                    : primaryColor(colorScheme),
              },
              {
                id: "notifications",
                title: translate("turn_on_notifications"),
                action: () => {
                  // @todo => move that to a helper because also used in AccountSettingsButton
                  if (notificationsPermissionStatus === "denied") {
                    if (Platform.OS === "android") {
                      // Android 13 is always denied first so let's try to show
                      requestPushNotificationsPermissions().then(
                        (
                          newStatus: NotificationPermissionStatus | undefined
                        ) => {
                          if (newStatus === "denied") {
                            Linking.openSettings();
                          } else if (newStatus) {
                            setNotificationsPermissionStatus(newStatus);
                          }
                        }
                      );
                    } else {
                      Linking.openSettings();
                    }
                  } else if (notificationsPermissionStatus === "undetermined") {
                    // Open popup
                    requestPushNotificationsPermissions().then(
                      (newStatus: NotificationPermissionStatus | undefined) => {
                        if (!newStatus) return;
                        setNotificationsPermissionStatus(newStatus);
                      }
                    );
                  }
                },
                titleColor:
                  Platform.OS === "android"
                    ? undefined
                    : primaryColor(colorScheme),
              },
              {
                id: "revokeOtherInstallations",
                title: translate("revoke_others_cta"),
                titleColor:
                  Platform.OS === "android"
                    ? undefined
                    : primaryColor(colorScheme),
                action: async () => {
                  try {
                    const client = (await getXmtpClient(
                      userAddress
                    )) as ConverseXmtpClientType;
                    const otherInstallations =
                      await getOtherInstallations(client);
                    if (otherInstallations.length === 0) {
                      Alert.alert(
                        translate("revoke_done_title"),
                        translate("revoke_empty")
                      );
                      return;
                    }
                    const signer = await getXmtpSigner();
                    if (!signer) return;

                    const revoked = await revokeOtherInstallations(
                      signer,
                      client,
                      otherInstallations.length
                    );
                    if (revoked) {
                      Alert.alert(
                        translate("revoke_done_title"),
                        translate("revoke_done_description", {
                          count: otherInstallations.length,
                        })
                      );
                    }
                  } catch (error) {
                    // TODO: Show error feedback to user
                    sentryTrackError(error);
                  }
                },
              },
              {
                id: "delete",
                title: translate("disconnect_this_account"),
                titleColor:
                  Platform.OS === "android"
                    ? undefined
                    : dangerColor(colorScheme),
                action: () => {
                  setTimeout(() => {
                    showDisconnectActionSheet(colorScheme);
                  }, 300);
                },
              },
            ].filter(
              (i) =>
                i.id !== "notifications" ||
                !(notificationsPermissionStatus === "granted")
            )}
            title={translate("actions")}
            style={styles.tableView}
          />
          {/* Removing until revoking is available */}
          {/* <TableView
            items={[
              {
                id: "revoke",
                title: translate("revoke_other_installations"),
                titleColor:
                  Platform.OS === "android"
                    ? undefined
                    : dangerColor(colorScheme),
                action: () => {
                  setTimeout(() => {
                    showRevokeActionSheet();
                  }, 300);
                },
              },
            ]}
            title={translate("security")}
            style={styles.tableView}
          /> */}

          <TableView
            items={[
              {
                id: "version",
                title: `v${appVersion} (${buildNumber})`,
              },
            ]}
            title={translate("app_version")}
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
    title: {
      textAlign: "center",
      fontSize: 34,
      fontWeight: "bold",
      marginVertical: 10,
      color: textPrimaryColor(colorScheme),
    },
    profile: {
      backgroundColor: backgroundColor(colorScheme),
    },
    profileContent: {
      paddingHorizontal: Platform.OS === "ios" ? 18 : 6,
    },
    tableView: {},
    balanceContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: Platform.OS === "ios" ? 0 : -5,
    },
    balance: {
      color: textPrimaryColor(colorScheme),
      fontSize: 17,
      marginRight: 10,
    },
    avatar: {
      marginBottom: 10,
      marginTop: 23,
      alignSelf: "center",
    },
    emoji: {
      backgroundColor: "rgba(118, 118, 128, 0.12)",
      borderRadius: 30,
    },
    errorText: {
      color: dangerColor(colorScheme),
      textAlign: "center",
    },
    errorContainer: {
      flexDirection: "row",
      alignSelf: "center",
    },
    errorIcon: {
      width: PictoSizes.textButton,
      height: PictoSizes.textButton,
      marginRight: 5,
    },
  });
};
