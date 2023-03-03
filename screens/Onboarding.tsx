import { configure, handleResponse } from "@coinbase/wallet-mobile-sdk";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Linking } from "react-native";

import OnboardingComponent from "../components/OnboardingComponent";
import config from "../config";
import WalletConnectProvider, {
  QrcodeModal,
  RenderQrcodeModalProps,
} from "../vendor/wallet-connect-dapp";

const canOpenURL = Linking.canOpenURL.bind(Linking);

Linking.canOpenURL = async (url: string) => {
  // Always try to open walletconnect URIs
  if (url.includes("wc?uri=wc")) {
    return true;
  }
  const result = await canOpenURL(url);
  return result;
};

configure({
  callbackURL: new URL(`${config.scheme}://`),
  hostURL: new URL("https://wallet.coinbase.com/wsegue"),
  hostPackageName: "org.toshi",
});

export default function OnboardingScreen() {
  const [walletConnectProps, setWalletConnectProps] = useState<
    RenderQrcodeModalProps | undefined
  >(undefined);
  const [hideModal, setHideModal] = useState(false);
  // Your app's deeplink handling code
  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => {
      handleResponse(new URL(url));
    });
    return () => sub.remove();
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
        if (walletConnectProps?.uri !== props.uri) {
          setWalletConnectProps(props);
        }
        const newProps = {
          ...props,
          visible: props.visible && !hideModal,
        };
        return <QrcodeModal division={4} {...newProps} />;
      }}
    >
      <OnboardingComponent
        walletConnectProps={walletConnectProps}
        setHideModal={setHideModal}
      />
    </WalletConnectProvider>
  );
}
