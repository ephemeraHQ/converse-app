import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { getAddress, isAddress } from "ethers/lib/utils";
import { StatusBar } from "expo-status-bar";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ColorSchemeName,
  useColorScheme,
} from "react-native";

import TableView, { TableViewSymbol } from "../components/TableView";
import { sendMessageToWebview } from "../components/XmtpWebview";
import config from "../config";
import { AppContext, StateType } from "../data/store/context";
import { XmtpConversation } from "../data/store/xmtpReducer";
import {
  backgroundColor,
  itemSeparatorColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
import { ethProvider } from "../utils/eth";
import { getLensOwner } from "../utils/lens";
import { lastValueInMap } from "../utils/map";
import { addressPrefix, conversationName } from "../utils/str";
import { isOnXmtp } from "../utils/xmtp";
import { NavigationParamList } from "./Main";

const computeNewConversationId = (state: StateType, peerAddress: string) => {
  let i = 0;
  const conversationsIds = Object.values(state.xmtp.conversations)
    .filter((c) => c.peerAddress.toLowerCase() === peerAddress.toLowerCase())
    .map((c) => c.context?.conversationId);
  do {
    i += 1;
  } while (
    conversationsIds.includes(
      `${config.conversationDomain}/dm/${addressPrefix(
        state.xmtp.address || ""
      )}-${addressPrefix(peerAddress)}/${i}`
    )
  );
  return `${config.conversationDomain}/dm/${addressPrefix(
    state.xmtp.address || ""
  )}-${addressPrefix(peerAddress)}/${i}`;
};

export default function NewConversation({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "NewConversation">) {
  const colorScheme = useColorScheme();
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Button
          title="Cancel"
          onPress={() => {
            navigation.goBack();
          }}
        />
      ),
    });
  }, [navigation]);

  const [value, setValue] = useState(route.params.peer || "");
  const searchingForValue = useRef("");

  const [status, setStatus] = useState({
    loading: false,
    error: "",
    address: "",
    askPolToInvite: "",
    existingConversations: [] as XmtpConversation[],
  });

  const { state } = useContext(AppContext);

  useEffect(() => {
    const searchForValue = async () => {
      setStatus(({ loading }) => ({
        loading,
        error: "",
        address: "",
        askPolToInvite: "",
        existingConversations: [],
      }));
      const is0x = isAddress(value.toLowerCase());
      const isLens = value.endsWith(config.lensSuffix);
      const isENS = value.endsWith(".eth");
      if (is0x || isLens || isENS) {
        setStatus(({ error }) => ({
          loading: true,
          error,
          address: "",
          askPolToInvite: "",
          existingConversations: [],
        }));
        searchingForValue.current = value;
        const resolvedAddress = isLens
          ? await getLensOwner(value)
          : isENS
          ? await ethProvider.resolveName(value.toLowerCase())
          : value;
        if (searchingForValue.current === value) {
          // If we're still searching for this one
          if (!resolvedAddress) {
            setStatus({
              loading: false,
              address: "",
              existingConversations: [],
              askPolToInvite: "",
              error: isLens
                ? "This handle does not exist. Please try again."
                : "No address has been set for this ENS domain. Please try again",
            });

            return;
          }
          const address = getAddress(resolvedAddress.toLowerCase());
          const addressIsOnXmtp = await isOnXmtp(address);
          if (searchingForValue.current === value) {
            if (addressIsOnXmtp) {
              // Let's find existing conversations with this user
              const conversations = Object.values(
                state.xmtp.conversations
              ).filter(
                (c) => c.peerAddress.toLowerCase() === address.toLowerCase()
              );
              setStatus({
                loading: false,
                error: "",
                address,
                askPolToInvite: "",
                existingConversations: conversations,
              });
            } else {
              setStatus({
                loading: false,
                error: `${value} has never used Converse or any other XMTP client. Ask our co-founder Pol to onboard them!`,
                address: "",
                askPolToInvite: value,
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
          askPolToInvite: "",
          existingConversations: [],
        });
        searchingForValue.current = "";
      }
    };
    searchForValue();
  }, [state.xmtp.conversations, value]);

  const conversationsTopics = useRef(Object.keys(state.xmtp.conversations));

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
  const waitingForNewConversation = useRef<false | string>(false);

  useEffect(() => {
    const newConversationsTopics = Object.keys(state.xmtp.conversations);
    if (waitingForNewConversation.current !== false) {
      const message = waitingForNewConversation.current;
      const newTopic = newConversationsTopics.find(
        (topic) => !conversationsTopics.current.includes(topic)
      );
      if (newTopic) {
        waitingForNewConversation.current = false;
        setCreatingNewConversation(false);
        navigateToTopic(newTopic, message);
      }
    }
    conversationsTopics.current = newConversationsTopics;
  }, [navigateToTopic, state.xmtp.conversations, state.xmtp.lastUpdateAt]);

  const createNewConversationWithPeer = useCallback(
    (state: StateType, peerAddress: string, prefilledMessage?: string) => {
      if (creatingNewConversation) return;
      waitingForNewConversation.current = prefilledMessage || "";
      setCreatingNewConversation(true);
      sendMessageToWebview("CREATE_CONVERSATION", {
        peerAddress,
        context: {
          conversationId: computeNewConversationId(state, peerAddress),
          metadata: {},
        },
      });
    },
    [creatingNewConversation]
  );

  const inputRef = useRef<TextInput | null>(null);
  const initialFocus = useRef(false);

  const styles = getStyles(colorScheme);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "white",
      }}
    >
      <StatusBar hidden={false} style="light" />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="0x, .eth, .lens …"
          autoCapitalize="none"
          autoFocus={false}
          autoCorrect={false}
          value={value}
          ref={(r) => {
            if (!initialFocus.current) {
              initialFocus.current = true;
              setTimeout(() => {
                r?.focus();
              }, 100);
            }
            inputRef.current = r;
          }}
          placeholderTextColor={textSecondaryColor(colorScheme)}
          onChangeText={(text) => setValue(text.trim())}
          clearButtonMode="always"
        />
      </View>
      <ScrollView
        style={styles.modal}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => {
          inputRef.current?.blur();
        }}
      >
        {!status.loading && !status.address && (
          <Text
            style={[styles.message, status.error ? styles.error : undefined]}
          >
            {status.error || "Type any .eth, .lens or 0x address"}
          </Text>
        )}

        {status.loading && <ActivityIndicator style={styles.activity} />}

        {!status.loading && status.askPolToInvite && (
          <TableView
            items={[
              {
                id: "reachOutToPol",
                picto: creatingNewConversation ? (
                  <ActivityIndicator
                    style={{ width: 32, height: 32, marginRight: 8 }}
                  />
                ) : (
                  <TableViewSymbol symbol="square.and.pencil" />
                ),
                title: "Reach out to Pol",
                subtitle: "",
                action: () => {
                  const conversationWithPol = Object.values(
                    state.xmtp.conversations
                  ).find(
                    (c) =>
                      c.peerAddress.toLowerCase() ===
                      config.polAddress.toLowerCase()
                  );
                  const message = `Hey Pol! I’d like to write to someone but this person is not on the network. Can you help me? Their address is ${status.askPolToInvite}`;
                  if (conversationWithPol) {
                    navigateToTopic(conversationWithPol.topic, message);
                  } else {
                    createNewConversationWithPeer(
                      state,
                      config.polAddress,
                      message
                    );
                  }
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
                  picto: <TableViewSymbol symbol="arrow.up.right" />,
                  title: conversationName(c),
                  subtitle: lastValueInMap(c.messages)?.content || "",
                  action: () => {
                    navigateToTopic(c.topic);
                  },
                }))}
                title="Existing conversations"
                style={styles.tableView}
              />
            )}

            <TableView
              items={[
                {
                  id: "new",
                  picto: creatingNewConversation ? (
                    <ActivityIndicator
                      style={{ width: 32, height: 32, marginRight: 8 }}
                    />
                  ) : (
                    <TableViewSymbol symbol="plus" />
                  ),
                  title: "Create a new conversation",
                  action: () => {
                    createNewConversationWithPeer(state, status.address);
                  },
                },
              ]}
              title="New conversation"
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
      borderBottomWidth: 0.5,
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
    message: {
      paddingTop: 23,
      fontSize: 17,
      color: textSecondaryColor(colorScheme),
      textAlign: "center",
      paddingHorizontal: 18,
    },
    error: {
      color: textPrimaryColor(colorScheme),
    },
    activity: {
      marginTop: 23,
    },
    tableView: {
      marginTop: 25,
    },
  });
