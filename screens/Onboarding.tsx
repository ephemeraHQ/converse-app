import AsyncStorage from "@react-native-async-storage/async-storage";
import WalletConnectProvider, {
  QrcodeModal,
  RenderQrcodeModalProps,
} from "@walletconnect/react-native-dapp";
import { useState } from "react";

import OnboardingComponent from "../components/OnboardingComponent";
import config from "../config";

export default function OnboardingScreen() {
  const [walletConnectProps, setWalletConnectProps] = useState<
    RenderQrcodeModalProps | undefined
  >(undefined);
  const [hideModal, setHideModal] = useState(false);
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
