import * as Linking from "expo-linking";
import React, { useCallback, useEffect, useState } from "react";
import { Platform, TouchableOpacity, useColorScheme } from "react-native";

import config from "../../config";
import {
  currentAccount,
  useLoggedWithPrivy,
  useWalletStore,
} from "../../data/store/accountsStore";
import { primaryColor, textSecondaryColor } from "../../utils/colors";
import { evmHelpers } from "../../utils/evm/helpers";
import Button from "../Button/Button";
import Picto from "../Picto/Picto";

export default function ProfileSettingsButton() {
  const colorScheme = useColorScheme();
  const isPrivy = useLoggedWithPrivy();
  const USDCBalance = useWalletStore((s) => s.USDCBalance);
  const [stringBalance, setStringBalance] = useState("");
  const [stringSize, setStringSize] = useState(0);
  const openProfile = useCallback(() => {
    Linking.openURL(
      Linking.createURL("/profile", {
        queryParams: { address: currentAccount() },
      })
    );
  }, []);
  useEffect(() => {
    const intBalance = parseInt(
      evmHelpers.fromDecimal(USDCBalance, config.evm.USDC.decimals),
      10
    );
    let str = "";
    if (intBalance < 1000) {
      str = `$${intBalance}`;
    } else if (intBalance < 10000) {
      str = `$${(Math.trunc(intBalance / 100) / 10).toFixed(1)}k`;
    } else {
      str = `$${Math.trunc(intBalance / 1000)}k`;
    }
    setStringBalance(str);
    setStringSize(str.length * 10 + 10);
  }, [USDCBalance]);
  if (isPrivy) {
    if (Platform.OS === "android") {
      return (
        <Button
          variant="primary"
          title={stringBalance}
          onPress={openProfile}
          style={{
            position: "absolute",
            right: 30,
            top: -16,
            width: stringSize,
            minWidth: 40,
            height: 30,
          }}
          textStyle={{
            marginHorizontal: 0,
            fontSize: 16,
            marginVertical: 5,
            height: 22,
            top: 1,
          }}
        />
      );
    }
    return (
      <Button
        variant="text"
        title={stringBalance}
        onPress={openProfile}
        style={{ marginTop: 3.5, marginRight: 16 }}
      />
    );
  }
  return (
    <TouchableOpacity activeOpacity={0.2} onPress={openProfile}>
      <Picto
        picto="person"
        weight="medium"
        color={
          Platform.OS === "ios"
            ? primaryColor(colorScheme)
            : textSecondaryColor(colorScheme)
        }
        size={Platform.OS === "ios" ? 16 : 24}
        style={{
          width: Platform.OS === "android" ? undefined : 32,
          height: Platform.OS === "android" ? undefined : 32,
          marginRight: Platform.OS === "android" ? 0 : 10,
          marginTop: Platform.OS === "ios" ? 3 : 0,
        }}
      />
    </TouchableOpacity>
  );
}
