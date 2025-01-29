import { config } from "@/config";
import * as Linking from "expo-linking";
import React, { useEffect } from "react";
import { PrivyProvider } from "@privy-io/expo";
import { SmartWalletsProvider } from "@privy-io/expo/smart-wallets";
import { Index } from "@/privy-demo-quickstart";
import { ThirdwebProvider } from "thirdweb/react";
import * as SplashScreen from "expo-splash-screen";

const prefix = Linking.createURL("/");

export default function Main() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);
  return (
    // <QueryClientProvider client={queryClient}>
    <PrivyProvider
      appId={config.privy.appId}
      clientId={config.privy.clientId}
      // storage={privySecureStorage}
      // supportedChains={[base]}
    >
      <SmartWalletsProvider>
        <ThirdwebProvider>
          <Index />
        </ThirdwebProvider>
      </SmartWalletsProvider>
    </PrivyProvider>
    // </QueryClientProvider>
  );
}
