import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getAddress } from "ethers/lib/utils";
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
  ColorSchemeName,
  useColorScheme,
  Platform,
} from "react-native";
import {
  Searchbar as MaterialSearchBar,
  IconButton as MaterialIconButton,
} from "react-native-paper";

import ActivityIndicator from "../components/ActivityIndicator/ActivityIndicator";
import AndroidBackAction from "../components/AndroidBackAction";
import Picto from "../components/Picto/Picto";
import Recommendations from "../components/Recommendations";
import TableView from "../components/TableView/TableView";
import { TableViewPicto } from "../components/TableView/TableViewImage";
import config from "../config";
import { createPendingConversation } from "../data";
import {
  useChatStore,
  useRecommendationsStore,
  useUserStore,
} from "../data/store/accountsStore";
import { XmtpConversation } from "../data/store/chatStore";
import {
  backgroundColor,
  itemSeparatorColor,
  primaryColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
import { conversationLastMessagePreview } from "../utils/conversation";
import { getAddressForPeer, isSupportedPeer } from "../utils/eth";
import { pick } from "../utils/objects";
import { addressPrefix, conversationName } from "../utils/str";
import { isOnXmtp } from "../utils/xmtp/client";
import { NavigationParamList } from "./Main";

const computeNewConversationContext = (
  userAddress: string,
  peerAddress: string
) => {
  let i = 0;
  const conversationsIds = Object.values(useChatStore.getState().conversations)
    .filter((c) => c.peerAddress?.toLowerCase() === peerAddress?.toLowerCase())
    .map((c) => c.context?.conversationId);
  // First try to create one without conversationId
  if (!conversationsIds.includes(undefined)) {
    return undefined;
  }
  do {
    i += 1;
  } while (
    conversationsIds.includes(
      `${config.conversationDomain}/dm/${addressPrefix(
        userAddress || ""
      )}-${addressPrefix(peerAddress)}/${i}`
    )
  );
  const conversationId = `${config.conversationDomain}/dm/${addressPrefix(
    userAddress || ""
  )}-${addressPrefix(peerAddress)}/${i}`;
  return {
    conversationId,
    metadata: {},
  };
};

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
  });

  const userAddress = useUserStore((s) => s.userAddress);
  const {
    updatedAt: recommendationsUpdatedAt,
    loading: recommendationsLoading,
    frens,
  } = useRecommendationsStore((s) =>
    pick(s, ["updatedAt", "loading", "frens"])
  );
  const recommendationsLoadedOnce = recommendationsUpdatedAt > 0;
  const recommendationsFrensCount = Object.keys(frens).length;

  useEffect(() => {
    const searchForValue = async () => {
      setStatus(({ loading }) => ({
        loading,
        error: "",
        address: "",
        inviteToConverse: "",
        existingConversations: [],
      }));

      if (isSupportedPeer(value)) {
        setStatus(({ error }) => ({
          loading: true,
          error,
          address: "",
          inviteToConverse: "",
          existingConversations: [],
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
              inviteToConverse: "",
              error:
                isLens || isFarcaster
                  ? "This handle does not exist. Please try again."
                  : "No address has been set for this domain.",
            });

            return;
          }
          const address = getAddress(resolvedAddress.toLowerCase());
          const addressIsOnXmtp = await isOnXmtp(address);
          if (searchingForValue.current === value) {
            if (addressIsOnXmtp) {
              // Let's find existing conversations with this user
              const conversations = Object.values(
                useChatStore.getState().conversations
              ).filter((conversation) => {
                if (!conversation || !conversation.peerAddress) {
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
              });
            } else {
              setStatus({
                loading: false,
                error: `${value} does not use Converse or XMTP yet`,
                address: "",
                inviteToConverse: value,
                existingConversations: [],
              });
            }
          }
        }
      } else {
        setStatus({
          loading: false,
          error: "",
          address: "",
          inviteToConverse: "",
          existingConversations: [],
        });
        searchingForValue.current = "";
      }
    };
    searchForValue();
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
        const newConversationTopic = await createPendingConversation(
          peerAddress,
          computeNewConversationContext(userAddress, peerAddress)
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

  const styles = getStyles(colorScheme);
  const showRecommendations =
    !status.loading && value.length === 0 && recommendationsFrensCount > 0;

  const inputPlaceholder = "0x, .eth, .lens, .fc, .cb.id, UD…";

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
      <View style={styles.inputContainer}>
        {Platform.OS === "ios" && (
          <TextInput
            style={styles.input}
            placeholder={inputPlaceholder}
            autoCapitalize="none"
            autoFocus={false}
            autoCorrect={false}
            value={value}
            ref={(r) => {
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
            placeholderTextColor={textSecondaryColor(colorScheme)}
            onChangeText={(text) => setValue(text.trim())}
            clearButtonMode="always"
          />
        )}
        {Platform.OS === "android" && (
          <MaterialSearchBar
            placeholder={inputPlaceholder}
            onChangeText={(query) => setValue(query.trim())}
            value={value}
            icon={({ color }) => (
              <Picto
                picto="search"
                size={24}
                color={color}
                style={{ top: 1 }}
              />
            )}
            mode="bar"
            autoCapitalize="none"
            autoFocus={false}
            autoCorrect={false}
            ref={(r) => {
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
              inputRef.current = r as TextInput;
            }}
            placeholderTextColor={textSecondaryColor(colorScheme)}
            selectionColor={textPrimaryColor(colorScheme)}
            style={{
              backgroundColor: backgroundColor(colorScheme),
            }}
            right={() => {
              if (!value) return null;
              return (
                <MaterialIconButton
                  icon={({ color }) => (
                    <Picto picto="xmark" size={24} color={color} />
                  )}
                  onPress={() => {
                    setValue("");
                  }}
                />
              );
            }}
            clearIcon={() => null}
          />
        )}
      </View>
      <View
        style={{
          backgroundColor: backgroundColor(colorScheme),
          height: showRecommendations ? undefined : 0,
        }}
      >
        <Recommendations visibility="EMBEDDED" navigation={navigation} />
      </View>
      <ScrollView
        style={[styles.modal, { height: showRecommendations ? 0 : undefined }]}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => {
          inputRef.current?.blur();
        }}
      >
        {!status.loading && !status.address && (
          <View style={styles.messageContainer}>
            {status.error && (
              <Text style={[styles.message, styles.error]}>{status.error}</Text>
            )}
            {!status.error &&
              (recommendationsFrensCount === 0 || value.length > 0) && (
                <Text style={styles.message}>
                  <Text>
                    Type the full address / domain of your contact (with .eth,
                    .lens, .fc, .cb.id etc.)
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

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
    },
    inputContainer: {
      borderBottomWidth: Platform.OS === "android" ? 1 : 0.5,
      borderBottomColor: itemSeparatorColor(colorScheme),
      backgroundColor: backgroundColor(colorScheme),
    },
    input: {
      height: 46,
      paddingLeft: 16,
      paddingRight: 8,
      marginRight: 8,
      fontSize: 17,
      color: textPrimaryColor(colorScheme),
    },
    messageContainer: {
      ...Platform.select({
        default: {
          marginTop: 23,
          paddingHorizontal: 18,
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
