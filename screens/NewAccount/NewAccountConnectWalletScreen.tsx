import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { memo, useCallback, useRef } from "react";

import { NewAccountScreenComp } from "../../components/NewAccount/NewAccountScreenComp";
import { ConnectViaWallet } from "../../components/Onboarding/ConnectViaWallet/ConnectViaWallet";
import { useRouter } from "../../navigation/useNavigation";
import { NavigationParamList } from "../Navigation/Navigation";

export const NewAccountConnectWalletScreen = memo(
  function NewAccountConnectWalletScreen({
    route,
  }: NativeStackScreenProps<NavigationParamList, "NewAccountConnectWallet">) {
    const { address } = route.params;

    const router = useRouter();

    const finishedConnecting = useRef(false);

    useFocusEffect(
      useCallback(
        () => {
          // User already connected wallet but decided to come back here, so we need to go back to new account screen
          if (finishedConnecting.current) {
            router.goBack();
          }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
      )
    );

    const handleDoneConnecthing = useCallback(
      () => {
        router.navigate("NewAccountUserProfile");
        finishedConnecting.current = true;
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );

    const handleErrorConnecting = useCallback(
      (arg: { error: Error }) => {
        router.goBack();
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
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
