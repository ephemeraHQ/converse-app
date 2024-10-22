import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { memo, useCallback } from "react";

import { NewAccountScreenComp } from "../../components/NewAccount/NewAccountScreenComp";
import { ConnectViaWallet } from "../../components/Onboarding/ConnectViaWallet/ConnectViaWallet";
import {
  ConnectViaWalletContextProvider,
  IConnectViaWalletContextType,
} from "../../components/Onboarding/ConnectViaWallet/ConnectViaWallet.context";
import { ConnectViaWalletStoreProvider } from "../../components/Onboarding/ConnectViaWallet/ConnectViaWallet.store";
import { useRouter } from "../../navigation/useNavigation";
import { NavigationParamList } from "../Navigation/Navigation";

export const NewAccountConnectWalletScreen = memo(
  function NewAccountConnectWalletScreen({
    route,
  }: NativeStackScreenProps<NavigationParamList, "NewAccountConnectWallet">) {
    const { signer } = route.params;

    const router = useRouter();

    const handleDoneConnecthing = useCallback(() => {
      router.navigate("NewAccountUserProfile");
    }, [router]);

    const handleErrorConnecting = useCallback(
      (
        args: Parameters<IConnectViaWalletContextType["onErrorConnecting"]>[0]
      ) => {
        const { error } = args;
        router.goBack();
      },
      [router]
    );

    return (
      <ConnectViaWalletStoreProvider signer={signer}>
        <ConnectViaWalletContextProvider
          onDoneConnecting={handleDoneConnecthing}
          onErrorConnecting={handleErrorConnecting}
        >
          <NewAccountScreenComp>
            {/* For now we don't need to have specific stuff for onboarding vs new account so we use this component to encapsulate the connect view wallet logic */}
            <ConnectViaWallet />
          </NewAccountScreenComp>
        </ConnectViaWalletContextProvider>
      </ConnectViaWalletStoreProvider>
    );
  }
);
