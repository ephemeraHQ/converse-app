import { configure, handleResponse } from "@coinbase/wallet-mobile-sdk";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WalletConnectProvider, {
  QrcodeModal,
  RenderQrcodeModalProps,
} from "@walletconnect/react-native-dapp";
import { useEffect, useState } from "react";
import { Dimensions, Linking, View } from "react-native";

import OnboardingComponent from "../components/OnboardingComponent";
import config from "../config";

const canOpenURL = Linking.canOpenURL.bind(Linking);

export default function OnboardingScreen() {
  const [walletConnectProps, setWalletConnectProps] = useState<
    RenderQrcodeModalProps | undefined
  >(undefined);
  const [hideModal, setHideModal] = useState(false);
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
    Linking.canOpenURL = async (url: string) => {
      console.log(`[Onboarding] Opening url ${url}`);
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
        if (walletConnectProps?.uri !== newProps.uri) {
          setWalletConnectProps(newProps);
        }
        newProps.visible = props.visible && !hideModal;

        return (
          <View
            pointerEvents="box-none"
            style={{
              opacity: hideModal ? 0 : 1,
              flex: 1,
              position: "absolute",
              top: 0,
              left: 0,
              height: Dimensions.get("screen").height,
              width: Dimensions.get("screen").width,
              flexGrow: 1,
            }}
          >
            <QrcodeModal division={3} {...newProps} />
          </View>
        );
      }}
    >
      <OnboardingComponent
        walletConnectProps={walletConnectProps}
        setHideModal={setHideModal}
      />
    </WalletConnectProvider>
  );
}
