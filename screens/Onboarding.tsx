import AsyncStorage from "@react-native-async-storage/async-storage";
import WalletConnectProvider, {
  QrcodeModal,
  RenderQrcodeModalProps,
} from "@walletconnect/react-native-dapp";

import OnboardingComponent from "../components/OnboardingComponent";
import config from "../config";

function Modal(props: RenderQrcodeModalProps) {
  return <QrcodeModal division={4} {...props} />;
}

export default function OnboardingScreen() {
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
        return <Modal {...props} />;
      }}
    >
      <OnboardingComponent />
    </WalletConnectProvider>
  );
}
