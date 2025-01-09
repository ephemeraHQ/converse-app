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
import { getOrBuildXmtpClient } from "@utils/xmtpRN/sync";
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
import Avatar from "../components/Avatar";
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
  useCurrentInboxId,
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
import { useGroupPermissionspForCurrentUser } from "../hooks/useGroupPermissionspForCurrentUser";
import { evmHelpers } from "../utils/evm/helpers";
import {
  isUserAdminByInboxId,
  isUserSuperAdminByInboxId,
} from "../utils/groupUtils/adminUtils";
import { ConversationNavParams } from "../features/conversation/conversation.nav";

import { getIPFSAssetURI } from "../utils/thirdweb";
import { refreshBalanceForAccount } from "../utils/wallet";
import { consentToInboxIdsOnProtocolForCurrentUser } from "../utils/xmtpRN/contacts";

import { Icon } from "@/design-system/Icon/Icon";
import { NotificationPermissionStatus } from "@/features/notifications/types/Notifications.types";
import { requestPushNotificationsPermissions } from "@/features/notifications/utils/requestPushNotificationsPermissions";
import { usePreferredAvatarUri } from "@/hooks/usePreferredAvatarUri";
import { usePreferredName } from "@/hooks/usePreferredName";
import { useProfileSocials } from "@/hooks/useProfileSocials";
import { getPreferredName } from "@/utils/profile";
import { getXmtpClient } from "@/utils/xmtpRN/conversations";
import { isCurrentUserInboxId } from "@/hooks/use-current-account-inbox-id";

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
    const peerInboxId = useRoute<"Profile">().params.inboxId;
    const { data: socials } = useProfileSocials({ peerInboxId });

    return (
      <ExternalWalletPicker
        title={translate("revoke_wallet_picker_title")}
        subtitle={translate("revoke_wallet_picker_description", {
          wallet: getPreferredName(socials),
        })}
      />
    );
  }
);

function ProfileScreenImpl() {
  const navigation = useRouter();
  const route = useRoute<"Profile">();

  const currentInboxId = useCurrentInboxId();
  const USDCBalance = useWalletStore((s) => s.USDCBalance);
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const [copiedAddresses, setCopiedAddresses] = useState<{
    [address: string]: boolean;
  }>({});
  const peerInboxId = route.params.inboxId;
  const recommendationTags = useRecommendationsStore(
    (s) => s.frens[peerInboxId]?.tags
  );
  const isBlockedPeer = useSettingsStore(
    (s) => s.peersStatus[peerInboxId.toLowerCase()] === "blocked"
  );
  const setPeersStatus = useSettingsStore((s) => s.setPeersStatus);
  const { data: socials } = useProfileSocials({ peerInboxId });
  const preferredUserName = usePreferredName({ inboxId: peerInboxId });
  const preferredAvatarUri = usePreferredAvatarUri({ inboxId: peerInboxId });
  const groupTopic = route.params.fromGroupTopic;
  const {
    members: groupMembers,
    removeMember,
    revokeAdmin,
    revokeSuperAdmin,
    promoteToAdmin,
    promoteToSuperAdmin,
  } = useGroupMembers({ topic: groupTopic! });
  const { permissions: groupPermissions } = useGroupPermissionspForCurrentUser(
    groupTopic!
  );

  const { getXmtpSigner } = useXmtpSigner();

  const insets = useSafeAreaInsets();
  const shouldShowError = useShouldShowErrored();
  const [refreshingBalance, setRefreshingBalance] = useState(false);

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
      [{ title: peerInboxId, address: peerInboxId }],
      "title",
      "address"
    ),
  ];

  const isPrivy = useLoggedWithPrivy();
  const showDisconnectActionSheet = useDisconnectActionSheet({
    inboxId: currentInboxId,
  });

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

  const isMyProfile = isCurrentUserInboxId(peerInboxId);
  const appVersion = Constants.expoConfig?.version;
  const buildNumber =
    Platform.OS === "ios"
      ? Constants.expoConfig?.ios?.buildNumber
      : Constants.expoConfig?.android?.versionCode;
  // const balanceItems: TableViewItemType[] = [
  //   {
  //     id: "balance",
  //     title: translate("your_balance_usdc"),
  //     rightView: (
  //       <View style={styles.balanceContainer}>
  //         <Text style={styles.balance}>
  //           ${evmHelpers.fromDecimal(USDCBalance, config.evm.USDC.decimals, 2)}
  //         </Text>
  //         <View style={{ width: 30 }}>
  //           {!refreshingBalance && (
  //             <View style={{ left: Platform.OS === "ios" ? 0 : -14 }}>
  //               <TableViewPicto
  //                 symbol="arrow.clockwise"
  //                 color={
  //                   Platform.OS === "android"
  //                     ? primaryColor(colorScheme)
  //                     : undefined
  //                 }
  //                 onPress={manuallyRefreshBalance}
  //               />
  //             </View>
  //           )}
  //           {refreshingBalance && <ActivityIndicator />}
  //         </View>
  //       </View>
  //     ),
  //   },
  // ];

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
                return params?.peer === peerInboxId.toLowerCase();
              });
            if (isPreviouslyInNavStack) {
              navigation.popToTop();
              navigation.navigate({
                name: "Conversation",
                params: {
                  peer: peerInboxId,
                },
              });
            } else {
              navigation.popToTop();
              navigation.dispatch(
                StackActions.push("Conversation", {
                  peer: peerInboxId,
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
            if (selectedIndex === 0 && peerInboxId) {
              const newStatus = isBlockedPeer ? "consented" : "blocked";
              const consentOnProtocol = isBlockedPeer ? "allow" : "deny";
              consentToInboxIdsOnProtocolForCurrentUser({
                inboxIds: [peerInboxId],
                consent: consentOnProtocol,
              });
              setPeersStatus({ [peerInboxId]: newStatus });

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
    const peer = groupMembers.byId[peerInboxId];
    if (!peer) {
      return items;
    }
    const currentAccountIsAdmin = isUserAdminByInboxId(
      currentInboxId,
      groupMembers
    );
    const currentAccountIsSuperAdmin = isUserSuperAdminByInboxId(
      currentInboxId,
      groupMembers
    );
    const peerIsAdmin = isUserAdminByInboxId(currentInboxId, groupMembers);
    const peerIsSuperAdmin = isUserSuperAdminByInboxId(
      currentInboxId,
      groupMembers
    );
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
              if (selectedIndex === 0 && peerInboxId) {
                await removeMember([peerInboxId]);
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
              if (selectedIndex === 0 && peerInboxId) {
                await promoteToAdmin(peerInboxId);
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
              if (selectedIndex === 0 && peerInboxId) {
                await promoteToSuperAdmin(peerInboxId);
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
              if (selectedIndex === 0 && peerInboxId) {
                await revokeSuperAdmin(peerInboxId);
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
              if (selectedIndex === 0 && peerInboxId) {
                await revokeAdmin(peerInboxId);
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
                    peer: route.params.inboxId,
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
                    const client = await getXmtpClient({
                      caller: "revokeOtherInstallations",
                      ifNotFoundStrategy: "logAndReturnUndefined",
                    });
                    if (!client) return;
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
