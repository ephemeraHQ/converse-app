import { NavigationParamList } from "@navigation/Navigation.types";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { memo, useCallback } from "react";

import { NewAccountScreenComp } from "../../components/NewAccount/NewAccountScreenComp";
import { ConnectViaWallet } from "../../components/Onboarding/ConnectViaWallet/ConnectViaWallet";
import { useRouter } from "../../navigation/useNavigation";

export const NewAccountConnectWalletScreen = memo(
  function NewAccountConnectWalletScreen({
    route,
  }: NativeStackScreenProps<NavigationParamList, "NewAccountConnectWallet">) {
    const { address } = route.params;

    const router = useRouter();

    const handleDoneConnecthing = useCallback(() => {
      router.navigate("NewAccountUserProfile");
    }, [router]);

    const handleErrorConnecting = useCallback(
      (arg: { error: Error }) => {
        router.goBack();
      },
      [router]
    );

    return (
      <NewAccountScreenComp>
        {/* For now we don't need to have specific stuff for onboarding vs new account so we use this component to encapsulate the connect view wallet logic */}
        <ConnectViaWallet
          address={address}
          onDoneConnecting={handleDoneConnecthing}
          onErrorConnecting={handleErrorConnecting}
        />
      </NewAccountScreenComp>
    );
  }
);
