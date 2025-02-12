/* eslint-disable react-native/no-inline-styles */
/**
 * 
 * name resolution priority: https://xmtp-labs.slack.com/archives/C087HJBB99P/p1739287069678659?thread_ts=1739237685.119069&cid=C087HJBB99P
shanemac
  Yesterday at 10:17 AM
ENS ✅
Farcaster
Base ✅ - technoplato.base.eth
Lens 🚧 - https://www.lensfrens.xyz/halfjew22
Unstoppable
 */
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  Text,
  View,
  ScrollView,
  Button,
  TextInput,
} from "react-native";
import Constants from "expo-constants";
import { PrivyPlaygroundLoginScreen } from "./privy-playground-login.screen";
import { PrivyPlaygroundUserScreen } from "./privy-playground-user.screen";
import { getConfig } from "@/config";
import logger from "@/utils/logger";
import * as SplashScreen from "expo-splash-screen";
import {
  AuthStatuses,
  useAccountsStore,
} from "../multi-inbox/multi-inbox.store";
import { useEnsName, useSocialProfiles } from "thirdweb/react";
import { thirdwebClient } from "@/utils/thirdweb";
import { ethers, utils as ethersUtils } from "ethers";
import { usePrivy } from "@privy-io/expo";

const AddressDebugger = ({ address }: { address: string }) => {
  const {
    data: profiles,
    status: profilesStatus,
    error: profilesError,
  } = useSocialProfiles({
    client: thirdwebClient,
    address,
  });

  // const {
  //   data: ens,
  //   status: ensStatus,
  //   error: ensError,
  // } = useEnsName({
  //   client: thirdwebClient,
  //   address,
  // });

  // log everything
  logger.debug("[AddressDebugger] Profiles:", profiles);
  logger.debug("[AddressDebugger] Profiles Status:", profilesStatus);
  logger.debug("[AddressDebugger] Profiles Error:", profilesError);
  // logger.debug("[AddressDebugger] Ens:", ens);
  // logger.debug("[AddressDebugger] Ens Status:", ensStatus);
  // logger.debug("[AddressDebugger] Ens Error:", ensError);

  // useEffect(() => {
  //   async function debugAddress() {
  //     try {
  //       // Validate and format the address
  //       const isValidAddress = ethersUtils.isAddress(address);
  //       const checksummedAddress = ethersUtils.getAddress(address);
  //       const lowercaseAddress = address.toLowerCase();

  //       logger.debug("[AddressDebugger] Address Analysis:", {
  //         originalAddress: address,
  //         isValidAddress,
  //         checksummedAddress,
  //         lowercaseAddress,
  //       });

  //       // Try ENS resolution with different address formats
  //       const provider = new ethers.providers.AlchemyProvider("mainnet");

  //       const [originalEns, checksumEns, lowercaseEns] = await Promise.all([
  //         provider.lookupAddress(address),
  //         provider.lookupAddress(checksummedAddress),
  //         provider.lookupAddress(lowercaseAddress),
  //       ]);

  //       logger.debug("[AddressDebugger] ENS Results:", {
  //         originalEns,
  //         checksumEns,
  //         lowercaseEns,
  //       });

  //       if (checksumEns) {
  //         const resolver = await provider.getResolver(checksumEns);
  //         if (resolver) {
  //           const avatar = await resolver.getText("avatar");
  //           const email = await resolver.getText("email");
  //           const url = await resolver.getText("url");
  //           const twitter = await resolver.getText("com.twitter");
  //           const github = await resolver.getText("com.github");

  //           logger.debug("[AddressDebugger] ENS Records for", checksumEns, {
  //             avatar,
  //             email,
  //             url,
  //             twitter,
  //             github,
  //           });
  //         }
  //       }
  //     } catch (err) {
  //       logger.error("[AddressDebugger] Error:", err);
  //     }
  //   }

  //   debugAddress();
  // }, [address]);

  // useEffect(() => {
  //   if (profiles) {
  //     logger.debug(
  //       "[AddressDebugger] Thirdweb Social Profiles for",
  //       address,
  //       ":",
  //       profiles
  //     );
  //   }
  //   if (error) {
  //     logger.error("[AddressDebugger] Thirdweb Social Profiles Error:", error);
  //   }
  // }, [profiles, error, address]);

  return (
    <View
      style={{
        marginTop: 20,
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.1)",
      }}
    >
      <Text style={{ fontWeight: "bold" }}>Address Debug Information</Text>
      <Text>Original: {address}</Text>
      <Text>Checksum: {ethersUtils.getAddress(address)}</Text>
      <Text>Status: {profilesStatus}</Text>
      {profiles && (
        <>
          <Text>
            Found {profiles.length} social profile(s). Check debug logs for
            details.
          </Text>
          <Text>{JSON.stringify(profiles, null, 2)}</Text>
        </>
      )}
      {profilesError && (
        <Text style={{ color: "red" }}>Error: {profilesError.message}</Text>
      )}
    </View>
  );
};

export function PrivyPlaygroundLandingScreen() {
  logger.info("PrivyPlaygroundLandingScreen");
  const { user: privyUser } = usePrivy();
  const mycbidaddress = "0x0aF849d2778f6ccE4A2641438B6207DC4750a82B";
  const myrainbowaddress = "0x5222f538B29267a991B346EF61A2A2c389A9f320";

  useEffect(() => {
    logger.debug("Hiding splash screen");
    Constants.expoConfig?.splash?.hide?.();
    SplashScreen.hideAsync();
    logger.debug("Splash screen hidden");
  }, []);

  if (privyUser) {
    return <PrivyPlaygroundUserScreen />;
  }

  // if (authStatus !== AuthStatuses.signedIn) {
  //   return <PrivyPlaygroundLoginScreen />;
  // }

  return (
    <SafeAreaView>
      <ScrollView style={{ borderColor: "rgba(0,0,0,0.1)", borderWidth: 1 }}>
        <View style={{ padding: 20 }}>
          {/* <NameResolver /> */}

          {/* Add reverse resolution */}
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontWeight: "bold", marginBottom: 10 }}>
              Reverse Resolution Testing
            </Text>
            {/* <ReverseResolver address={mycbidaddress} /> */}
          </View>

          <Text style={{ fontWeight: "bold", marginBottom: 10, marginTop: 20 }}>
            Debug All Available Addresses
          </Text>

          {/* Debug linked accounts */}
          {/* {privyUser?.linked_accounts?.map(
            (account: any) =>
              account.address && (
                <View key={account.address}>
                  <Text style={{ fontWeight: "bold", marginTop: 10 }}>
                    Linked Account ({account.type}):
                  </Text>
                  <AddressDebugger address={account.address} />
                </View>
              )
          )} */}

          {/* Debug your hardcoded Coinbase address */}
          <Text style={{ fontWeight: "bold", marginTop: 10 }}>
            Hardcoded Coinbase Address:
          </Text>
          <AddressDebugger address={mycbidaddress} />
          <AddressDebugger address={myrainbowaddress} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
