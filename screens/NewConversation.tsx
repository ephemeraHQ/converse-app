import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { isAddress } from "ethers/lib/utils";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { resolveENSName } from "../utils/ens";
import { getLensOwner } from "../utils/lens";
import { isOnXmtp } from "../utils/xmtp";
import { NavigationParamList } from "./Main";

export default function NewConversation({
  navigation,
}: NativeStackScreenProps<NavigationParamList, "NewConversation">) {
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Button title="Cancel" onPress={() => navigation.goBack()} />
      ),
      headerStyle: {
        backgroundColor: "#F5F5F5",
      },
    });
  }, [navigation]);

  const [value, setValue] = useState("");
  const searchingForValue = useRef("");

  const [status, setStatus] = useState({ loading: false, error: "" });

  useEffect(() => {
    const searchForValue = async () => {
      setStatus(({ loading }) => ({ loading, error: "" }));
      const is0x = isAddress(value);
      const isLens = value.endsWith(".lens");
      const isENS = value.endsWith(".eth");
      if (is0x || isLens || isENS) {
        setStatus(({ error }) => ({ loading: true, error }));
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
              error: isLens
                ? "This handle does not exist. Please try again."
                : "This ENS domain does not exist. Please try again",
            });

            return;
          }
          const addressIsOnXmtp = await isOnXmtp(address);
          if (searchingForValue.current === value) {
            if (addressIsOnXmtp) {
              // VICTORY
              setStatus({ loading: false, error: "" });
            } else {
              setStatus({
                loading: false,
                error: `${value} has never used Converse or any other XMTP client. Ask our co-founder Pol to onboard them!`,
              });
            }
          }
        }
      } else {
        setStatus({ loading: false, error: "" });
        searchingForValue.current = "";
      }
    };
    searchForValue();
  }, [value]);

  return (
    <>
      <StatusBar hidden={false} style="light" />
      <View style={styles.modal}>
        <TextInput
          style={styles.input}
          placeholder="0x, .eth, .lens …"
          autoCapitalize="none"
          autoFocus
          autoCorrect={false}
          value={value}
          onChangeText={(text) => setValue(text.trim())}
        />
        {!status.loading && (
          <Text
            style={[styles.message, status.error ? styles.error : undefined]}
          >
            {status.error || "Type any .eth, .lens or 0x address"}
          </Text>
        )}

        {status.loading && <ActivityIndicator style={styles.activity} />}
      </View>
    </>
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
});
