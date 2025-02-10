import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useLoginWithPasskey as usePrivyLoginWithPasskey,
  useSignupWithPasskey as usePrivySignupWithPasskey,
} from "@privy-io/expo/passkey";
import { captureErrorWithToast } from "@/utils/capture-error";
import { RELYING_PARTY } from "@/features/onboarding/passkey.constants";
import logger from "@/utils/logger";
import { usePrivy, useEmbeddedEthereumWallet } from "@privy-io/expo";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import {
  AuthStatuses,
  useAccountsStore,
} from "@/features/multi-inbox/multi-inbox.store";
import { base } from "viem/chains";
import { InboxSigner } from "@/features/multi-inbox/multi-inbox-client.types";

const useXmtpFromPrivySmartWalletClientSigner = ({
  onSmartClientReady,
  invokedWhen,
}: {
  onSmartClientReady: (signer: InboxSigner) => Promise<void>;
  invokedWhen: boolean;
}) => {
  const { client: smartWalletClient } = useSmartWallets();
  const { isReady } = usePrivy();
  const oldSmartWalletClient = useRef(smartWalletClient);

  const smartWalletClientString = useMemo(
    () => JSON.stringify(smartWalletClient),
    [smartWalletClient]
  );

  const oldSmartWalletClientString = useMemo(
    () => JSON.stringify(oldSmartWalletClient.current),
    []
  );

  const hasSmartWalletClientChanged = useMemo(
    () => smartWalletClientString !== oldSmartWalletClientString,
    [smartWalletClientString, oldSmartWalletClientString]
  );

  const newSmartWalletClientExistsAndIsReady = useMemo(
    () => !!smartWalletClient && isReady,
    [smartWalletClient, isReady]
  );
  const hasInvokedOnSmartClientReady = useRef(false);

  useEffect(() => {
    if (!newSmartWalletClientExistsAndIsReady) {
      return;
    }

    if (!hasSmartWalletClientChanged) {
      /// note(lustig) Smart Wallet Client from Privy is not referentially stable, so it will trigger
      /// this effect every render. This check prevents is from invoking the callback
      /// every render
      return;
    }

    if (hasInvokedOnSmartClientReady.current) {
      return;
    }

    if (!invokedWhen) {
      return;
    }

    hasInvokedOnSmartClientReady.current = true;

    const signer: InboxSigner = {
      getAddress: async () => {
        return smartWalletClient!.account.address;
      },
      getChainId: () => {
        return smartWalletClient!.chain?.id;
      },
      getBlockNumber: () => undefined,
      walletType: () => "SCW",
      signMessage: async (message: string) => {
        return smartWalletClient!.signMessage({ message });
      },
    };

    onSmartClientReady(signer);
  }, [
    hasSmartWalletClientChanged,
    newSmartWalletClientExistsAndIsReady,
    smartWalletClient,
    onSmartClientReady,
    invokedWhen,
  ]);
};

const SignupWithPasskeyContext = createContext<
  | {
      signupWithPasskey: () => Promise<void>;
      loginWithPasskey: () => Promise<void>;
    }
  | undefined
>(undefined);
export const SignupWithPasskeyProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { senders, currentSender } = useAccountsStore();
  useEffect(() => {
    if (senders.length === 0) {
      return;
    }
    logger.debug(
      "[signup with passkey provider] amount of senders changed: ",
      senders.length
    );
  }, [senders.length]);
  useEffect(() => {
    if (
      currentSender?.ethereumAddress === undefined ||
      currentSender?.inboxId === undefined
    ) {
      return;
    }
    logger.debug(
      "[signup with passkey provider] current sender changed: ",
      JSON.stringify(currentSender, null, 2)
    );
  }, [currentSender]);

  const { loginWithPasskey: privyLoginWithPasskey } =
    usePrivyLoginWithPasskey();
  const { create: createEmbeddedWallet } = useEmbeddedEthereumWallet();

  const { signupWithPasskey: privySignupWithPasskey } =
    usePrivySignupWithPasskey({
      onSuccess: (privyUser, isNewUser) => {
        logger.debug(
          "[passkey onboarding context] Successfully signed up with passkey, going to create a new embedded wallet (which will in turn automatically create a new Smart Contract Wallet)",
          privyUser,
          isNewUser
        );
      },
      onError: (error) => {
        logger.error(
          "[passkey onboarding context] Error signing up with passkey",
          error
        );
        captureErrorWithToast(error);
      },
    });
  const authStatus = useAccountsStore.getState().authStatus;
  const signingUp = authStatus === AuthStatuses.signingUp;
  const signingIn = authStatus === AuthStatuses.signingIn;

  const { user: privyUser, isReady } = usePrivy();

  useXmtpFromPrivySmartWalletClientSigner({
    invokedWhen: signingUp && senders.length === 0,
    onSmartClientReady: async (signer) => {
      logger.debug(
        "[passkey onboarding context] Smart wallet client signer is ready"
      );
      await MultiInboxClient.instance.createNewInboxForPrivySmartContractWallet(
        {
          inboxSigner: signer,
        }
      );

      logger.debug(
        "[passkey onboarding context] signing up and created a new inbox successfully in useXmtpFromPrivySmartWalletClientSigner"
      );
      // logger.error(
      //   "[passkey onboarding context] temp setting login after signup noramlly we'd create profile now"
      // );
      // useAccountsStore.getState().setAuthStatus(AuthStatuses.signedIn);
    },
  });

  useXmtpFromPrivySmartWalletClientSigner({
    invokedWhen: signingIn && senders.length === 0,
    onSmartClientReady: async (signer) => {
      logger.debug(
        "[passkey onboarding context] Smart wallet client signer is ready"
      );
      await MultiInboxClient.instance.createNewInboxForPrivySmartContractWallet(
        {
          inboxSigner: signer,
        }
      );

      logger.debug(
        "[passkey onboarding context] signing up and created a new inbox successfully in useXmtpFromPrivySmartWalletClientSigner"
      );
      useAccountsStore.getState().setAuthStatus(AuthStatuses.signedIn);
    },
  });

  useEffect(() => {
    try {
      if (privyUser?.id && signingUp) {
        createEmbeddedWallet();
      }
    } catch (error) {
      logger.error(
        "[passkey onboarding context] Error in privyUser effect:",
        error
      );
      throw error;
    }
  }, [privyUser?.id, signingUp, createEmbeddedWallet, privyUser]);

  const signupWithPasskey = async () => {
    useAccountsStore.getState().setAuthStatus(AuthStatuses.signingUp);
    await privySignupWithPasskey({
      relyingParty: RELYING_PARTY,
    });
  };

  const loginWithPasskey = async () => {
    useAccountsStore.getState().setAuthStatus(AuthStatuses.signingIn);
    await privyLoginWithPasskey({
      relyingParty: RELYING_PARTY,
    });
  };

  return (
    <SignupWithPasskeyContext.Provider
      value={{ signupWithPasskey, loginWithPasskey }}
    >
      {children}
    </SignupWithPasskeyContext.Provider>
  );
};
export const useSignupWithPasskey = () => {
  const context = useContext(SignupWithPasskeyContext);
  if (!context) {
    throw new Error(
      "useSignupWithPasskey must be used within a SignupWithPasskeyProvider"
    );
  }
  return context;
};
