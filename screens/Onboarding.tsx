import { configure, handleResponse } from "@coinbase/wallet-mobile-sdk";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WalletConnectProvider, {
  QrcodeModal,
  RenderQrcodeModalProps,
  WalletService,
} from "@walletconnect/react-native-dapp";
import { useEffect, useState } from "react";
import { Linking } from "react-native";

import OnboardingComponent from "../components/OnboardingComponent";
import config from "../config";

const canOpenURL = Linking.canOpenURL.bind(Linking);

export default function OnboardingScreen() {
  const [walletConnectProps, setWalletConnectProps] = useState<
    RenderQrcodeModalProps | undefined
  >(undefined);
  const [hideModal, setHideModal] = useState(false);
  const [connectToDemoWallet, setConnectToDemoWallet] = useState(false);
  // Your app's deeplink handling code
  useEffect(() => {
    // On dev with hot reloading, this will make the app crash
    // because we reload JS app so we call configure again
    // but we don't reboot the native app and the Coinbase SDK crashes
    // if we call configure a second time.
    configure({
      callbackURL: new URL(`https://${config.websiteDomain}/coinbase`),
      hostURL: new URL("https://wallet.coinbase.com/wsegue"),
      hostPackageName: "org.toshi",
    });
    const sub = Linking.addEventListener("url", ({ url }) => {
      handleResponse(new URL(url));
    });
    // Overwriting canOpenURL to be sure we can open everything
    Linking.canOpenURL = async () => {
      return true;
    };
    return () => {
      sub.remove();
      Linking.canOpenURL = canOpenURL;
    };
  }, []);
  return (
    <WalletConnectProvider
      redirectUrl={`${config.scheme}://"`}
      storageOptions={{
        // @ts-expect-error: Internal
        asyncStorage: AsyncStorage,
      }}
      clientMeta={{
        description:
          "Converse connects web3 identities with each other via messaging.",
        url: "https://getconverse.app",
        icons: ["https://i.postimg.cc/qvfXMMDT/icon.png"],
        name: "Converse",
      }}
      renderQrcodeModal={(props) => {
        const newProps = {
          ...props,
          walletServices: [...props.walletServices],
        };
        // Add a demo wallet
        newProps.walletServices.push({
          id: "demo",
          name: "Demo",
        } as any);
        newProps.connectToWalletService = async (
          walletService: WalletService,
          uri?: string
        ) => {
          if (walletService.id === "demo") {
            setConnectToDemoWallet(true);
          } else {
            await props.connectToWalletService(walletService, uri);
          }
        };
        if (walletConnectProps?.uri !== newProps.uri) {
          setWalletConnectProps(newProps);
        }
        newProps.visible = props.visible && !hideModal;

        return <QrcodeModal division={4} {...newProps} />;
      }}
    >
      <OnboardingComponent
        walletConnectProps={walletConnectProps}
        setHideModal={setHideModal}
        connectToDemoWallet={connectToDemoWallet}
        setConnectToDemoWallet={setConnectToDemoWallet}
      />
    </WalletConnectProvider>
  );
}
