import { useModalStatus, usePrivy, useWallets } from "@privy-io/react-auth";
import { useWeb3ModalProvider } from "@web3modal/ethers5/react";
import { useEffect, useRef } from "react";

import config from "../../config";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { useSelect } from "../../data/store/storeHelpers";
import { getPrivyAuthenticatedUser } from "../../utils/api";
import { usePrivyAccessToken, usePrivySigner } from "../../utils/evm/privy";

export default function Onboarding() {
  const { walletProvider } = useWeb3ModalProvider();
  const connectingToXmtp = useRef(false);
  const {
    login: loginWithPrivy,
    logout: logoutFromPrivy,
    user: privyUser,
  } = usePrivy();
  const { isOpen: isModalOpen } = useModalStatus();
  const wasModalOpen = useRef(isModalOpen);

  const { wallets } = useWallets();
  const privyEmbeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy"
  );
  const privyAccessToken = usePrivyAccessToken();
  const privySigner = usePrivySigner(true);
  const { setLoading, setSigner, setPrivyAccountId, setStep, resetOnboarding } =
    useOnboardingStore(
      useSelect([
        "setLoading",
        "setSigner",
        "setPrivyAccountId",
        "setStep",
        "resetOnboarding",
      ])
    );

  useEffect(() => {
    logoutFromPrivy().then(loginWithPrivy);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isModalOpen && wasModalOpen.current && !privyUser) {
      resetOnboarding();
    }
    wasModalOpen.current = isModalOpen;
  }, [isModalOpen, privyUser, resetOnboarding]);

  useEffect(() => {
    (async () => {
      if (
        privyEmbeddedWallet &&
        privyUser &&
        !connectingToXmtp.current &&
        privyAccessToken &&
        privySigner
      ) {
        connectingToXmtp.current = true;
        setLoading(true);
        try {
          await privyEmbeddedWallet.switchChain(
            config.evm.transactionChainId as `0x${string}`
          );

          try {
            const user = await getPrivyAuthenticatedUser();
            if (user && user.privyAccountId === privyUser.id) {
              // Existing users can access now
              setPrivyAccountId(privyUser.id);
              setSigner(privySigner);
              return;
            }
          } catch (e) {
            console.log(e);
          }
          // Others need an invite code
          setStep("invite");
        } catch (e) {
          console.error(e);
        }
        setLoading(false);
        connectingToXmtp.current = false;
      }
    })();
  }, [
    privyAccessToken,
    privyEmbeddedWallet,
    privySigner,
    privyUser,
    setLoading,
    setPrivyAccountId,
    setSigner,
    setStep,
    walletProvider,
  ]);

  return <></>;
}
