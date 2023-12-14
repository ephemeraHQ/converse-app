import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  Platform,
} from "react-native";

import ActivityIndicator from "../components/ActivityIndicator/ActivityIndicator";
import AndroidBackAction from "../components/AndroidBackAction";
import SearchBar from "../components/NewConversation/SearchBar";
import Recommendations from "../components/Recommendations/Recommendations";
import ProfileSearch from "../components/Search/ProfileSearch";
import TableView from "../components/TableView/TableView";
import { TableViewPicto } from "../components/TableView/TableViewImage";
import config from "../config";
import { createPendingConversation } from "../data/helpers/conversations/pendingConversations";
import {
  currentAccount,
  useChatStore,
  useCurrentAccount,
  useRecommendationsStore,
} from "../data/store/accountsStore";
import { XmtpConversation } from "../data/store/chatStore";
import { ProfileSocials } from "../data/store/profilesStore";
import { searchProfiles } from "../utils/api";
import {
  backgroundColor,
  primaryColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
import {
  computeNewConversationContext,
  conversationLastMessagePreview,
} from "../utils/conversation";
import {
  getAddressForPeer,
  getCleanAddress,
  isSupportedPeer,
} from "../utils/eth";
import { isEmptyObject, pick } from "../utils/objects";
import { conversationName } from "../utils/str";
import { isOnXmtp } from "../utils/xmtpRN/client";
import { NavigationParamList } from "./Navigation/Navigation";

export default function NewConversation({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "NewConversation">) {
  const colorScheme = useColorScheme();
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () =>
        Platform.OS === "ios" ? (
          <Button
            title="Cancel"
            onPress={() => {
              navigation.goBack();
            }}
          />
        ) : (
          <AndroidBackAction navigation={navigation} />
        ),
    });
  }, [navigation]);

  const [value, setValue] = useState(route.params.peer || "");
  const searchingForValue = useRef("");
  const [status, setStatus] = useState({
    loading: false,
    error: "",
    address: "",
    inviteToConverse: "",
    existingConversations: [] as XmtpConversation[],
    profileSearchResults: {} as { [address: string]: ProfileSocials },
  });

  const userAddress = useCurrentAccount() as string;
  const {
    updatedAt: recommendationsUpdatedAt,
    loading: recommendationsLoading,
    frens,
  } = useRecommendationsStore((s) =>
    pick(s, ["updatedAt", "loading", "frens"])
  );
  const recommendationsLoadedOnce = recommendationsUpdatedAt > 0;
  const recommendationsFrensCount = Object.keys(frens).length;

  const debounceDelay = 500;
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value.length < 3) {
      // If the input is less than 3 characters, do nothing
      setStatus({
        loading: false,
        error: "",
        address: "",
        inviteToConverse: "",
        existingConversations: [],
        profileSearchResults: {},
      });
      return;
    }

    if (debounceTimer.current !== null) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      const searchForValue = async () => {
        setStatus(({ loading }) => ({
          loading,
          error: "",
          address: "",
          inviteToConverse: "",
          existingConversations: [],
          profileSearchResults: {},
        }));

        if (isSupportedPeer(value)) {
          setStatus(({ error }) => ({
            loading: true,
            error,
            address: "",
            inviteToConverse: "",
            existingConversations: [],
            profileSearchResults: {},
          }));
          searchingForValue.current = value;
          const resolvedAddress = await getAddressForPeer(value);
          if (searchingForValue.current === value) {
            // If we're still searching for this one
            if (!resolvedAddress) {
              const isLens = value.endsWith(config.lensSuffix);
              const isFarcaster = value.endsWith(".fc");
              setStatus({
                loading: false,
                address: "",
                existingConversations: [],
                profileSearchResults: {},
                inviteToConverse: "",
                error:
                  isLens || isFarcaster
                    ? "This handle does not exist. Please try again."
                    : "No address has been set for this domain.",
              });

              return;
            }
            const address = getCleanAddress(resolvedAddress);
            const addressIsOnXmtp = await isOnXmtp(address);
            if (searchingForValue.current === value) {
              if (addressIsOnXmtp) {
                // Let's find existing conversations with this user
                const conversations = Object.values(
                  useChatStore.getState().conversations
                ).filter((conversation) => {
                  if (
                    !conversation ||
                    !conversation.peerAddress ||
                    conversation.pending
                  ) {
                    return false;
                  }
                  return (
                    conversation.peerAddress?.toLowerCase() ===
                    address?.toLowerCase()
                  );
                });

                setStatus({
                  loading: false,
                  error: "",
                  address,
                  inviteToConverse: "",
                  existingConversations: conversations,
                  profileSearchResults: {},
                });
              } else {
                setStatus({
                  loading: false,
                  error: `${value} does not use Converse or XMTP yet`,
                  address: "",
                  inviteToConverse: value,
                  existingConversations: [],
                  profileSearchResults: {},
                });
              }
            }
          }
        } else {
          setStatus({
            loading: true,
            error: "",
            address: "",
            inviteToConverse: "",
            existingConversations: [],
            profileSearchResults: {},
          });

          const profiles = await searchProfiles(value, currentAccount());

          if (!isEmptyObject(profiles)) {
            setStatus({
              loading: false,
              error: "",
              address: "",
              inviteToConverse: "",
              existingConversations: [],
              profileSearchResults: profiles,
            });
          } else {
            setStatus({
              loading: false,
              error: "",
              address: "",
              inviteToConverse: "",
              existingConversations: [],
              profileSearchResults: {},
            });
          }
        }
      };
      searchForValue();
    }, debounceDelay);

    return () => {
      if (debounceTimer.current !== null) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value]);

  const navigateToTopic = useCallback(
    (topic: string, message?: string) => {
      navigation.goBack();
      setTimeout(() => {
        navigation.navigate("Conversation", { topic, message, focus: true });
      }, 300);
    },
    [navigation]
  );

  const [creatingNewConversation, setCreatingNewConversation] = useState(false);

  const createNewConversationWithPeer = useCallback(
    async (userAddress: string, peerAddress: string) => {
      if (creatingNewConversation) return;
      setCreatingNewConversation(true);

      try {
        const newConversationContext = computeNewConversationContext(
          userAddress,
          peerAddress
        );
        const newConversationTopic = await createPendingConversation(
          currentAccount(),
          peerAddress,
          newConversationContext
        );
        navigateToTopic(newConversationTopic);
      } catch (e: any) {
        console.log(e);
        setCreatingNewConversation(false);
      }
    },
    [creatingNewConversation, navigateToTopic]
  );

  const inputRef = useRef<TextInput | null>(null);
  const initialFocus = useRef(false);

  const styles = useStyles();
  const showRecommendations =
    !status.loading && value.length === 0 && recommendationsFrensCount > 0;

  const inputPlaceholder = ".converse.xyz, 0x, .eth, .lens, .fc, .cb.id, UD…";

  const getLastMessagePreview = useCallback(
    (c: XmtpConversation) => {
      const lastMessage = conversationLastMessagePreview(c, userAddress);
      return lastMessage?.contentPreview || "";
    },
    [userAddress]
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "white",
      }}
    >
      {Platform.OS === "ios" && <StatusBar hidden={false} style="light" />}
      <SearchBar
        value={value}
        setValue={setValue}
        onRef={(r) => {
          if (!initialFocus.current) {
            initialFocus.current = true;
            if (
              !value &&
              !recommendationsLoading &&
              recommendationsLoadedOnce &&
              recommendationsFrensCount === 0
            ) {
              setTimeout(() => {
                r?.focus();
              }, 100);
            }
          }
          inputRef.current = r;
        }}
        inputPlaceholder={inputPlaceholder}
      />

      {!status.loading && !isEmptyObject(status.profileSearchResults) && (
        <View>
          <ProfileSearch
            navigation={navigation}
            profiles={status.profileSearchResults}
          />
        </View>
      )}

      {isEmptyObject(status.profileSearchResults) && (
        <View
          style={{
            backgroundColor: backgroundColor(colorScheme),
            height: showRecommendations ? undefined : 0,
          }}
        >
          <Recommendations visibility="EMBEDDED" navigation={navigation} />
        </View>
      )}

      <ScrollView
        style={[styles.modal, { height: showRecommendations ? 0 : undefined }]}
        keyboardShouldPersistTaps="handled"
        onTouchStart={() => {
          inputRef.current?.blur();
        }}
      >
        {!status.loading &&
          !status.address &&
          isEmptyObject(status.profileSearchResults) && (
            <View style={styles.messageContainer}>
              {status.error && (
                <Text style={[styles.message, styles.error]}>
                  {status.error}
                </Text>
              )}
              {!status.error && (
                <Text style={styles.message}>
                  <Text>
                    Type the full address/domain of your contact (with
                    .converse.xyz, .eth, .lens, .fc, .cb.id…)
                  </Text>
                </Text>
              )}
            </View>
          )}

        {status.loading && (
          <ActivityIndicator style={styles.mainActivityIndicator} />
        )}

        {!status.loading && status.inviteToConverse && (
          <TableView
            items={[
              {
                id: "reachOutToPol",
                leftView: creatingNewConversation ? (
                  <ActivityIndicator
                    style={styles.tableViewActivityIndicator}
                  />
                ) : (
                  <TableViewPicto symbol="link" />
                ),
                title: "Invite them to Converse",
                subtitle: "",
                action: () => {
                  navigation.goBack();
                  Linking.openURL(Linking.createURL("/shareProfile"));
                },
              },
            ]}
            style={styles.tableView}
          />
        )}

        {!status.loading && status.address && (
          <>
            {status.existingConversations.length > 0 && (
              <TableView
                items={status.existingConversations.map((c) => ({
                  id: c.topic,
                  leftView: <TableViewPicto symbol="arrow.up.right" />,
                  title: conversationName(c),
                  subtitle: getLastMessagePreview(c),
                  action: () => {
                    navigateToTopic(c.topic);
                  },
                }))}
                title="EXISTING CONVERSATIONS"
                style={styles.tableView}
              />
            )}

            <TableView
              items={[
                {
                  id: "new",
                  leftView: creatingNewConversation ? (
                    <ActivityIndicator
                      style={styles.tableViewActivityIndicator}
                    />
                  ) : (
                    <TableViewPicto symbol="plus" />
                  ),
                  title: "Create a new conversation",
                  action: () => {
                    createNewConversationWithPeer(userAddress, status.address);
                  },
                },
              ]}
              title="NEW CONVERSATION"
              style={[styles.tableView, { marginBottom: 50 }]}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
    },
    messageContainer: {
      ...Platform.select({
        default: {
          marginTop: 23,
          paddingHorizontal: 16,
        },
        android: {
          marginRight: 16,
          marginLeft: 16,
          marginTop: 16,
        },
      }),
    },
    message: {
      ...Platform.select({
        default: {
          fontSize: 17,
          textAlign: "center",
        },
        android: {
          fontSize: 14,
        },
      }),

      color: textSecondaryColor(colorScheme),
    },
    clickableText: {
      color: primaryColor(colorScheme),
      fontWeight: "500",
    },
    error: {
      color:
        Platform.OS === "android"
          ? textSecondaryColor(colorScheme)
          : textPrimaryColor(colorScheme),
    },
    mainActivityIndicator: {
      marginTop: 23,
    },
    tableView: {
      marginHorizontal: Platform.OS === "android" ? 0 : 18,
    },
    tableViewActivityIndicator: {
      width: 32,
      height: 32,
      ...Platform.select({
        default: { marginRight: 8 },
        android: { marginLeft: 12, marginRight: -4 },
      }),
    },
  });
};
