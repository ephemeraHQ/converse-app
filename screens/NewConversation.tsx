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
  const [loading, setLoading] = useState(false);
  const searchingForValue = useRef("");
  const [error, setError] = useState("");

  useEffect(() => {
    const searchForValue = async () => {
      const is0x = isAddress(value);
      const isLens = value.endsWith(".lens");
      const isENS = value.endsWith(".eth");
      if (is0x || isLens || isENS) {
        setLoading(true);
        searchingForValue.current = value;
        const address = isLens
          ? await getLensOwner(value)
          : isENS
          ? await resolveENSName(value)
          : value;
        if (searchingForValue.current === value) {
          // If we're still searching for this one
          if (!address) {
            setLoading(false);
            setError(
              isLens
                ? "This handle does not exist. Please try again."
                : "This ENS domain does not exist. Please try again"
            );
          }
          // await check if xmtp exists
        }
      } else {
        setLoading(false);
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
        {!loading && (
          <Text style={styles.message}>Type any .eth, .lens or 0x address</Text>
        )}
        {loading && <ActivityIndicator style={styles.activity} />}
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
  },
  activity: {
    marginTop: 23,
  },
});
