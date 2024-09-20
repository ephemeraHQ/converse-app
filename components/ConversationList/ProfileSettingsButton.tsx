import { AvatarSizes } from "@styles/sizes";
import React, { useCallback, useEffect, useState } from "react";
import { Platform, TouchableOpacity } from "react-native";

import config from "../../config";
import {
  currentAccount,
  useLoggedWithPrivy,
  useProfilesStore,
  useWalletStore,
} from "../../data/store/accountsStore";
import { evmHelpers } from "../../utils/evm/helpers";
import { navigate } from "../../utils/navigation";
import {
  getPreferredAvatar,
  getPreferredName,
  getProfile,
} from "../../utils/profile";
import Avatar from "../Avatar";
import Button from "../Button/Button";

export default function ProfileSettingsButton() {
  const isPrivy = useLoggedWithPrivy();
  const USDCBalance = useWalletStore((s) => s.USDCBalance);
  const [stringBalance, setStringBalance] = useState("");
  const [stringSize, setStringSize] = useState(0);
  const account = currentAccount();
  const profiles = useProfilesStore((state) => state.profiles);
  const socials = getProfile(account, profiles)?.socials;

  const openProfile = useCallback(() => {
    navigate("Profile", { address: currentAccount() });
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
  // Disabled with "false" until payments UX sorted
  if (isPrivy && false) {
    if (Platform.OS === "android" || Platform.OS === "web") {
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
      <Avatar
        uri={getPreferredAvatar(socials)}
        size={AvatarSizes.profileSettings}
        style={{
          marginRight: Platform.OS === "android" ? 0 : 10,
          marginTop: Platform.OS === "ios" ? 3 : 0,
        }}
        name={getPreferredName(socials, account)}
      />
    </TouchableOpacity>
  );
}
