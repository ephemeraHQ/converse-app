import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { isAddress } from "ethers/lib/utils";
import { setStatusBarStyle, StatusBar } from "expo-status-bar";
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
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Keyboard,
} from "react-native";

import TableView, { TableViewSymbol } from "../components/TableView";
import { sendMessageToWebview } from "../components/XmtpWebview";
import config from "../config";
import { AppContext, StateType } from "../data/store/context";
import { XmtpConversation } from "../data/store/xmtpReducer";
import { resolveENSName } from "../utils/ens";
import { getLensOwner } from "../utils/lens";
import { addressPrefix, conversationName } from "../utils/str";
import { isOnXmtp } from "../utils/xmtp";
import { NavigationParamList } from "./Main";

const computeNewConversationId = (state: StateType, peerAddress: string) => {
  let i = 0;
  const conversationsIds = Object.values(state.xmtp.conversations)
    .filter((c) => c.peerAddress === peerAddress)
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
  navigation,
}: NativeStackScreenProps<NavigationParamList, "NewConversation">) {
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Button
          title="Cancel"
          onPress={() => {
            setStatusBarStyle("dark");
            navigation.goBack();
          }}
        />
      ),
      headerStyle: {
        backgroundColor: "#F5F5F5",
      },
    });
  }, [navigation]);

  const [value, setValue] = useState("");
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
      const is0x = isAddress(value);
      const isLens = value.endsWith(".lens");
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
        const address = isLens
          ? await getLensOwner(value)
          : isENS
          ? await resolveENSName(value)
          : value;
        if (searchingForValue.current === value) {
          // If we're still searching for this one
          if (!address) {
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
        navigation.navigate("Conversation", { topic, message });
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
    conversationsTopics.current = Object.keys(state.xmtp.conversations);
  }, [navigateToTopic, state.xmtp.conversations]);

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

  const keyboardWillShow = useCallback(() => {
    setStatusBarStyle("light");
  }, []);

  useEffect(() => {
    const sub = Keyboard.addListener("keyboardWillShow", keyboardWillShow);
    return () => {
      sub.remove();
    };
  }, [keyboardWillShow]);

  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        backgroundColor: "white",
      }}
      behavior="padding"
      enabled
      keyboardVerticalOffset={100}
    >
      <StatusBar hidden={false} style="light" />
      <ScrollView style={styles.modal} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.input}
          placeholder="0x, .eth, .lens …"
          autoCapitalize="none"
          autoFocus={false}
          autoCorrect={false}
          value={value}
          ref={(r) => {
            setTimeout(() => {
              r?.focus();
            }, 100);
          }}
          onChangeText={(text) => setValue(text.trim())}
        />
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
                  subtitle: c.messages?.[0]?.content || "",
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: "white",
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(60, 60, 67, 0.36)",
    height: 46,
    paddingHorizontal: 16,
    fontSize: 17,
  },
  message: {
    paddingTop: 23,
    fontSize: 17,
    color: "rgba(60, 60, 67, 0.6)",
    textAlign: "center",
    paddingHorizontal: 18,
  },
  error: {
    color: "black",
  },
  activity: {
    marginTop: 23,
  },
  tableView: {
    marginTop: 25,
  },
});
