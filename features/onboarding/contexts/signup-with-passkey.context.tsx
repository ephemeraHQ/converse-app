import { createContext, useContext, useEffect, useState } from "react";
import {
  useLoginWithPasskey as usePrivyLoginWithPasskey,
  useSignupWithPasskey as usePrivySignupWithPasskey,
} from "@privy-io/expo/passkey";
import { captureErrorWithToast } from "@/utils/capture-error";
import { RELYING_PARTY } from "@/features/onboarding/passkey.constants";
import logger from "@/utils/logger";
import { skipToken, useQuery, queryOptions } from "@tanstack/react-query";
import {
  usePrivy,
  useEmbeddedEthereumWallet,
  usePrivyClient,
  useCreateGuestAccount,
} from "@privy-io/expo";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import {
  AuthStatuses,
  useAccountsStore,
} from "@/features/multi-inbox/multi-inbox.store";

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
  const { client: smartWalletClient } = useSmartWallets();

  const { logout: privyLogout, user } = usePrivy();
  const { loginWithPasskey: privyLoginWithPasskey } =
    usePrivyLoginWithPasskey();
  const { create: createEmbeddedWallet } = useEmbeddedEthereumWallet();
  const privySmartWallets = user?.linked_accounts.filter(
    (account) => account.type === "smart_wallet"
  );
  const privySmartWalletAddressFromLinkedAccounts =
    privySmartWallets?.[0]?.address;
  const privySmartWalletAddressFromSmartWalletClient =
    smartWalletClient?.account.address;
  const privySmartWalletsMatch =
    privySmartWalletAddressFromLinkedAccounts ===
    privySmartWalletAddressFromSmartWalletClient;

  useEffect(() => {
    logger.debug(
      "[SignupWithPasskeyProvider] privySmartWalletsMatch",
      JSON.stringify(
        {
          privySmartWalletAddressFromLinkedAccounts,
          privySmartWalletAddressFromSmartWalletClient,
          privySmartWalletsMatch,
        },
        null,
        2
      )
    );
  }, [
    privySmartWalletAddressFromLinkedAccounts,
    privySmartWalletAddressFromSmartWalletClient,
    privySmartWalletsMatch,
  ]);

  const { signupWithPasskey: privySignupWithPasskey } =
    usePrivySignupWithPasskey({
      onSuccess: (privyUser, isNewUser) => {
        logger.debug(
          "[OnboardingWelcomeScreenContent] Successfully signed up with passkey, going to create a new embedded wallet (which will in turn automatically create a new Smart Contract Wallet)",
          privyUser,
          isNewUser
        );
      },
      onError: (error) => {
        logger.error(
          "[OnboardingWelcomeScreenContent] Error signing up with passkey",
          error
        );
        captureErrorWithToast(error);
      },
    });
  const authStatus = useAccountsStore.getState().authStatus;
  const signingUp = authStatus === AuthStatuses.signingUp;
  const signingIn = authStatus === AuthStatuses.signingIn;

  useEffect(() => {
    if (!smartWalletClient) {
      logger.debug(
        "[passkey onboarding context] No smart wallet client available yet"
      );
      return;
    }

    if (!signingUp) {
      logger.debug(
        "[passkey onboarding context] We are creating the inbox from a login differently than signup so returning here"
      );
      return;
    }

    // don't love doing async functions use effects, but let's get this working and then refactor

    // don't love doing async functions use effects, but let's get this working and then refactor
    async function createNewInbox() {
      logger.debug(
        `[passkey onboarding context] Creating new inbox with smart wallet client address: ${smartWalletClient?.account.address}`
      );
      try {
        await MultiInboxClient.instance.createNewInboxForPrivySmartContractWallet(
          {
            privySmartWalletClient: smartWalletClient,
          }
        );
      } catch (error) {
        logger.error(
          "[passkey onboarding context] Error creating inbox:",
          error
        );
        useAccountsStore.getState().setAuthStatus(AuthStatuses.signedOut);
        throw error;
      }
    }

    createNewInbox();
  }, [smartWalletClient, signingUp]);

  const { user: privyUser } = usePrivy();

  useEffect(() => {
    try {
      logger.debug("[passkey onboarding context] privyUser changing", {
        signingUp,
        privyUserId: privyUser?.id,
      });
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
  }, [privyUser?.id, signingUp, createEmbeddedWallet]);

  useEffect(() => {
    if (!signingIn || !smartWalletClient) {
      logger.debug(
        "[passkey onboarding context] waiting for signing in and smart wallet client"
      );

      return;
    }

    async function initializeWalletForLoggingInAccount() {
      logger.debug(
        `[passkey onboarding context] Initializing wallet for logging in with smart wallet client address: ${smartWalletClient?.account.address}`
      );
      await MultiInboxClient.instance.createNewInboxForPrivySmartContractWallet(
        {
          privySmartWalletClient: smartWalletClient,
        }
      );
      useAccountsStore.getState().setAuthStatus(AuthStatuses.signedIn);
    }

    initializeWalletForLoggingInAccount();
  }, [signingIn, smartWalletClient]);

  const signupWithPasskey = async () => {
    await privyLogout();
    useAccountsStore.getState().setAuthStatus(AuthStatuses.signingUp);
    await privySignupWithPasskey({
      relyingParty: RELYING_PARTY,
    });
  };

  useEffect(() => {
    if (signingIn) {
      logger.debug("[passkey onboarding context] signing in", {
        signingIn,
      });
    }
  }, [signingIn, smartWalletClient]);

  const loginWithPasskey = async () => {
    await privyLogout();
    await privyLoginWithPasskey({
      relyingParty: RELYING_PARTY,
    });
    useAccountsStore.getState().setAuthStatus(AuthStatuses.signingIn);
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
