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
  TouchableOpacity,
  View,
  useColorScheme,
  ViewStyle,
} from "react-native";
import { Text } from "@/design-system/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeader } from "@/navigation/use-header";
import { HStack } from "@design-system/HStack";
import { HeaderAction } from "@/design-system/Header/HeaderAction";
import {
  ContextMenuButton,
  MenuActionConfig,
} from "react-native-ios-context-menu";
import { Haptics } from "@/utils/haptics";
import { iconRegistry, Icon } from "@/design-system/Icon/Icon";
import {
  useAccountsList,
  useAccountsStore,
  useCurrentAccount,
  currentAccount,
  useRecommendationsStore,
  useSettingsStore,
  useWalletStore,
} from "@/data/store/accountsStore";
import { useAccountsProfiles } from "@/utils/useAccountsProfiles";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { navigate } from "@/utils/navigation";

import ActivityIndicator from "@components/ActivityIndicator/ActivityIndicator";
import { Avatar } from "@components/Avatar";
import { showActionSheetWithOptions } from "@components/StateHandlers/ActionSheetStateHandler";
import TableView, { TableViewItemType } from "@components/TableView/TableView";
import {
  TableViewEmoji,
  TableViewImage,
  TableViewPicto,
} from "@components/TableView/TableViewImage";
import config from "@config";
import { useAppStore } from "@data/store/appStore";
import { useSelect } from "@data/store/storeHelpers";
import { ExternalWalletPicker } from "@features/ExternalWalletPicker/ExternalWalletPicker";
import { ExternalWalletPickerContextProvider } from "@features/ExternalWalletPicker/ExternalWalletPicker.context";
import { useGroupMembers } from "@hooks/useGroupMembers";
import { useGroupPermissions } from "@hooks/useGroupPermissions";
import { evmHelpers } from "@utils/evm/helpers";
import {
  getAddressIsAdmin,
  getAddressIsSuperAdmin,
} from "@utils/groupUtils/adminUtils";
import { ConversationNavParams } from "@features/conversation/conversation.nav";

import { getPreferredUsername } from "@utils/profile/getPreferredUsername";
import { getIPFSAssetURI } from "@utils/thirdweb";
import { updateConsentForAddressesForAccount } from "@/features/consent/update-consent-for-addresses-for-account";

import { NotificationPermissionStatus } from "@/features/notifications/types/Notifications.types";
import { requestPushNotificationsPermissions } from "@/features/notifications/utils/requestPushNotificationsPermissions";
import { useCurrentAccountXmtpClient } from "@/hooks/useCurrentAccountXmtpClient";
import { usePreferredAvatarUri } from "@/hooks/usePreferredAvatarUri";
import { usePreferredName } from "@/hooks/usePreferredName";
import { useProfileSocials } from "@/hooks/useProfileSocials";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { VStack } from "@/design-system/VStack";
import { Button } from "@/design-system/Button/Button";

const $sectionContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
});

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

/**
 * ContactCard Component
 *
 * A card component that displays contact information with a 3D tilt effect.
 * Includes name, bio, avatar with interactive animations.
 */
const ContactCard = memo(function ContactCard({
  name,
  bio,
  avatarUri,
}: {
  name: string;
  bio?: string;
  avatarUri?: string;
}) {
  const { theme } = useAppTheme();
  const colorScheme = useColorScheme();

  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const shadowOffsetX = useSharedValue(0);
  const shadowOffsetY = useSharedValue(6); // Positive value pushes shadow down

  const baseStyle = {
    backgroundColor: theme.colors.fill.primary,
    borderRadius: theme.borderRadius.xs,
    padding: theme.spacing.xl,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.fill.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
    ],
    shadowOffset: {
      width: shadowOffsetX.value,
      height: shadowOffsetY.value,
    },
    ...baseStyle,
  }));

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      // Reset values when gesture starts
      rotateX.value = withSpring(0);
      rotateY.value = withSpring(0);
      shadowOffsetX.value = withSpring(0);
      shadowOffsetY.value = withSpring(0);
    })
    .onUpdate((event) => {
      // Update tilt based on pan gesture
      rotateX.value = event.translationY / 10;
      rotateY.value = event.translationX / 10;
      shadowOffsetX.value = -event.translationX / 20;
      shadowOffsetY.value = event.translationY / 20;
    })
    .onEnd(() => {
      // Reset to original position when gesture ends
      rotateX.value = withSpring(0);
      rotateY.value = withSpring(0);
      shadowOffsetX.value = withSpring(0);
      shadowOffsetY.value = withSpring(0);
    });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>
        <VStack>
          <Avatar
            uri={avatarUri}
            name={name}
            size={theme.avatarSize.lg}
            style={{
              marginBottom: theme.spacing.xxl,
              alignSelf: "flex-start",
            }}
          />
          <View>
            <Text
              preset="bodyBold"
              style={{
                color: theme.colors.text.inverted.primary,
                marginBottom: theme.spacing.xxxs,
              }}
            >
              {name}
            </Text>
            {bio && (
              <Text
                preset="smaller"
                style={{ color: theme.colors.text.inverted.secondary }}
              >
                {bio}
              </Text>
            )}
          </View>
        </VStack>
      </Animated.View>
    </GestureDetector>
  );
});

function ProfileScreenImpl() {
  const { theme, themed } = useAppTheme();
  const router = useRouter();
  const account = useCurrentAccount();
  const accounts = useAccountsList();
  const accountsProfiles = useAccountsProfiles();
  const setCurrentAccount = useAccountsStore((s) => s.setCurrentAccount);
  const route = useRoute<"Profile">();
  const peerAddress = route.params.address;
  const { data: socials } = useProfileSocials(peerAddress);
  const preferredUserName = usePreferredName(peerAddress);
  const setPeersStatus = useSettingsStore((s) => s.setPeersStatus);
  const colorScheme = useColorScheme();

  useHeader(
    {
      safeAreaEdges: ["top"],
      titleComponent: (
        <Text preset="body">
          {router.canGoBack()
            ? router.getState().routes[router.getState().routes.length - 2].name
            : ""}
        </Text>
      ),
      LeftActionComponent: (
        <HeaderAction
          icon="chevron.left"
          onPress={() => {
            router.goBack();
          }}
        />
      ),
      RightActionComponent: (
        <HStack
          style={{
            alignItems: "center",
            columnGap: theme.spacing.xxs,
          }}
        >
          <HeaderAction
            icon="qrcode"
            onPress={() => {
              navigate("ShareProfile");
            }}
          />
          <ContextMenuButton
            style={{
              paddingVertical: theme.spacing.sm,
              paddingRight: theme.spacing.xxxs,
            }}
            isMenuPrimaryAction
            onPressMenuItem={({ nativeEvent }) => {
              Haptics.selectionAsync();
              if (nativeEvent.actionKey === "share") {
                navigate("ShareProfile");
              } else if (nativeEvent.actionKey === "copy") {
                Clipboard.setString(peerAddress);
                //Alert.alert(translate("profile.address_copied"));
              } else if (nativeEvent.actionKey === "block") {
                Alert.alert(
                  "Title", //translate("profile.block.title"),
                  /*translate("profile.block.message", {
                  name: preferredUserName,
                })*/
                  "Message",
                  [
                    {
                      text: translate("cancel"),
                      style: "cancel",
                    },
                    {
                      text: translate("block"),
                      style: "destructive",
                      onPress: () => {
                        setPeersStatus({ [peerAddress]: "blocked" });
                        router.goBack();
                      },
                    },
                  ]
                );
              }
            }}
            menuConfig={{
              menuTitle: "",
              menuItems: [
                {
                  actionKey: "share",
                  actionTitle: translate("share"),
                  icon: {
                    iconType: "SYSTEM",
                    iconValue: "square.and.arrow.up",
                  },
                },
                {
                  actionKey: "copy",
                  actionTitle: translate("copy"),
                  icon: {
                    iconType: "SYSTEM",
                    iconValue: "doc.on.doc",
                  },
                },
                {
                  actionKey: "block",
                  actionTitle: translate("block"),
                  icon: {
                    iconType: "SYSTEM",
                    iconValue: "person.crop.circle.badge.xmark",
                  },
                  menuAttributes: ["destructive"],
                },
              ],
            }}
          >
            <HeaderAction icon="more_vert" />
          </ContextMenuButton>
        </HStack>
      ),
    },
    [router, theme, peerAddress, preferredUserName, setPeersStatus, colorScheme]
  );

  const navigation = useRouter();
  const userAddress = useCurrentAccount() as string;
  const [copiedAddresses, setCopiedAddresses] = useState<{
    [address: string]: boolean;
  }>({});
  const recommendationTags = useRecommendationsStore(
    (s) => s.frens[peerAddress]?.tags
  );
  const isBlockedPeer = useSettingsStore(
    (s) => s.peersStatus[peerAddress.toLowerCase()] === "blocked"
  );
  const { data: client } = useCurrentAccountXmtpClient();
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

  const insets = useSafeAreaInsets();
  const shouldShowError = useShouldShowErrored();

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
            <TableViewEmoji emoji="👋" />
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
              updateConsentForAddressesForAccount({
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

  const handleChatPress = useCallback(() => {
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
  }, [navigation, peerAddress]);

  return (
    <ScrollView
      style={{
        backgroundColor: theme.colors.background.surface,
      }}
      contentContainerStyle={{
        paddingHorizontal: theme.spacing.lg,
      }}
    >
      {!isBlockedPeer && (
        <ContactCard
          name={preferredUserName}
          // TODO: implement bio from the profile from Convos backend/local db
          // bio="Soccer dad and physical therapist"
          avatarUri={preferredAvatarUri}
        />
      )}

      <Button
        onPress={handleChatPress}
        text="Chat"
        variant="outline"
        style={{
          marginTop: theme.spacing.xxxs,
          marginBottom: theme.spacing.xl,
        }}
      />

      {isMyProfile && shouldShowError && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: theme.spacing.lg,
          }}
        >
          <Icon
            icon="exclamationmark.triangle"
            color={dangerColor(colorScheme)}
            size={PictoSizes.textButton}
            style={{
              width: theme.iconSize.sm,
              height: theme.iconSize.sm,
            }}
          />
          <Text
            style={{
              color: dangerColor(colorScheme),
              marginLeft: theme.spacing.xxs,
            }}
          >
            {translate("client_error")}
          </Text>
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
          style={themed($sectionContainer)}
        />
      )}

      {usernamesItems.length > 0 && (
        <TableView
          items={usernamesItems}
          title={`USERNAME${usernamesItems.length > 1 ? "S" : ""}`}
          style={themed($sectionContainer)}
        />
      )}

      <TableView
        items={addressItems}
        title={translate("address")}
        style={themed($sectionContainer)}
      />

      {route.params?.fromGroupTopic && !isMyProfile && (
        <TableView
          items={[
            {
              id: "message",
              title: translate("send_a_message"),
              titleColor: primaryColor(colorScheme),
              action: () => {
                navigation.popToTop();
                navigation.dispatch(
                  StackActions.push("Conversation", {
                    peer: route.params.address,
                  })
                );
              },
            },
          ]}
          style={themed($sectionContainer)}
        />
      )}

      {socialItems.length > 0 && (
        <TableView
          items={socialItems}
          title={translate("social")}
          style={themed($sectionContainer)}
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
              style={themed($sectionContainer)}
            />
          )}
          <TableView
            items={actionsTableViewItems}
            title={translate("actions")}
            style={themed($sectionContainer)}
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
                    const otherInstallations = await getOtherInstallations(
                      client
                    );
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
            style={themed($sectionContainer)}
          />

          <TableView
            items={[
              {
                id: "version",
                title: `v${appVersion} (${buildNumber})`,
              },
            ]}
            title={translate("app_version")}
            style={themed($sectionContainer)}
          />
        </>
      )}
      <View style={{ height: insets.bottom }} />
    </ScrollView>
  );
}
