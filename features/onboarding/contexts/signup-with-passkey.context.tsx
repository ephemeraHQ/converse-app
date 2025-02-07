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

const embeddedWalletQueryKey = (args: {
  privyUserId: string | undefined;
  embeddedWalletIndex: number;
}) => ["embeddedWallet", args.privyUserId, args.embeddedWalletIndex];

export function getEmbeddedWalletQueryOptions(args: {
  privyUserId: string;
  embeddedWalletIndex: number;
  createEmbeddedWallet: (index: number) => Promise<{
    embeddedWalletAddress: string;
  }>;
}) {
  const enabled = !!args.privyUserId && args.embeddedWalletIndex >= 0;
  // logger.debug(
  //   `[getEmbeddedWalletQueryOptions] Enabled: ${enabled}, privyUserId: ${args.privyUserId}, embeddedWalletIndex: ${args.embeddedWalletIndex}`
  // );
  return queryOptions({
    queryKey: embeddedWalletQueryKey({
      privyUserId: args.privyUserId,
      embeddedWalletIndex: args.embeddedWalletIndex,
    }),
    queryFn: enabled
      ? () => args.createEmbeddedWallet(args.embeddedWalletIndex)
      : skipToken,
    enabled,
    staleTime: Infinity,
  });
}

const useCreateEmbeddedWallet = (args: { embeddedWalletIndex: number }) => {
  const { create: createEmbeddedWallet } = useEmbeddedEthereumWallet();
  const { user } = usePrivy();
  const client = usePrivyClient();
  return useQuery(
    getEmbeddedWalletQueryOptions({
      privyUserId: user?.id,
      embeddedWalletIndex: args.embeddedWalletIndex,
      createEmbeddedWallet: async (index) => {
        try {
          logger.debug(
            `[createEmbeddedWallet] Creating embedded wallet at index: ${index}`
          );
          const userBeforeCreate = await client.user.get();
          logger.debug(
            `[createEmbeddedWallet] User before create: ${JSON.stringify(
              userBeforeCreate,
              null,
              2
            )}`
          );

          const linkedWalletsBefore = userBeforeCreate.user?.linked_accounts
            .filter((account) => account.type === "wallet")
            .map((account) => account.address);

          logger.debug(
            `[createEmbeddedWallet] Linked wallets before create: ${JSON.stringify(
              linkedWalletsBefore,
              null,
              2
            )}`
          );

          if (
            (linkedWalletsBefore?.length ?? 0) - 1 ===
            args.embeddedWalletIndex
          ) {
            throw new Error(
              `An attempt to create an embedded wallet with index ${args.embeddedWalletIndex} was made, but the user already has ${linkedWalletsBefore?.length} wallets before creation.`
            );
          }

          const { user } = await createEmbeddedWallet({
            createAdditional: true,
          });
          const linkedWalletsAfter = user.linked_accounts
            .filter((account) => account.type === "wallet")
            .map((account) => account.address);

          logger.debug(
            `[createEmbeddedWallet] Linked wallets after create: ${JSON.stringify(
              linkedWalletsAfter,
              null,
              2
            )}`
          );

          const newWallets = linkedWalletsAfter.filter(
            (walletAfter) => !linkedWalletsBefore?.includes(walletAfter)
          );

          logger.debug(
            `[createEmbeddedWallet] New wallets: ${JSON.stringify(
              newWallets,
              null,
              2
            )}`
          );

          // sort where the oldest wallet is last in the array
          const embeddedWallets = user.linked_accounts
            .filter((account) => account.type === "wallet")
            .sort(
              (a, b) => (a.first_verified_at ?? 0) - (b.first_verified_at ?? 0)
            );

          logger.debug(
            `[createEmbeddedWallet] Found ${embeddedWallets.length} embedded wallets`
          );

          const walletAtIndex = embeddedWallets[index];
          if (!walletAtIndex) {
            logger.error(
              `[createEmbeddedWallet] No wallet found at index: ${index}`
            );
            throw new Error("Wallet not found");
          }
          logger.debug(
            `[createEmbeddedWallet] Successfully retrieved wallet at index ${index} with address: ${walletAtIndex.address}`
          );
          return { embeddedWalletAddress: walletAtIndex.address };
        } catch (error) {
          logger.error(
            `[createEmbeddedWallet] Failed to create embedded wallet: ${error}`
          );
          throw error;
        }
      },
    })
  );
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
  const { client: smartWalletClient } = useSmartWallets();
  const { logout: privyLogout, user } = usePrivy();
  const { loginWithPasskey: privyLoginWithPasskey } =
    usePrivyLoginWithPasskey();
  const { create: createEmbeddedWallet } = useEmbeddedEthereumWallet();
  const privyUserEmbeddedWallets = user?.linked_accounts.filter(
    (account) => account.type === "wallet"
  );
  const embeddedWalletAddress = privyUserEmbeddedWallets?.[0]?.address;

  logger.debug(
    "[SignupWithPasskeyProvider] privyUserEmbeddedWallets",
    privyUserEmbeddedWallets
  );

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

  // const [embeddedWalletIndexToCreate, setEmbeddedWalletIndexToCreate] =
  //   useState(-1);

  // const {
  //   data: embeddedWalletAddress,
  //   error: embeddedWalletError,
  //   status: embeddedWalletStatus,
  // } = /* wont fire until user is logged in*/ useCreateEmbeddedWallet({
  //   embeddedWalletIndex: embeddedWalletIndexToCreate,
  // });

  // logger.debug(
  //   "[OnboardingWelcomeScreenContent] embeddedWalletAddress",
  //   embeddedWalletAddress,
  //   isEmbeddedWalletLoading,
  //   embeddedWalletError,
  //   embeddedWalletStatus
  // );

  const [startTime, setStartTime] = useState<number>();

  useEffect(() => {
    //  takes on the order of 1-2 seconds
    /*
     LOG  11:53:53 AM | DEBUG : [OnboardingWelcomeScreenContent] Smart wallet client creation took 1439ms 
      LOG  11:57:51 AM | DEBUG : [OnboardingWelcomeScreenContent] Smart wallet client creation took 1590ms 
    */
    if (embeddedWalletAddress && !smartWalletClient) {
      setStartTime(Date.now());
      logger.debug(
        "[passkey onboarding context] Starting smart wallet client creation timer"
      );
    }
  }, [embeddedWalletAddress, smartWalletClient]);

  useEffect(() => {
    if (smartWalletClient && startTime) {
      const duration = Date.now() - startTime;
      logger.debug(
        `[passkey onboarding context] Smart wallet client creation took ${duration}ms`
      );
    }
  }, [smartWalletClient, startTime]);

  useEffect(() => {
    if (embeddedWalletAddress) {
      logger.debug(
        "[passkey onboarding context] Embedded wallet has been created, going to wait for Smart Contract Wallet to be created and then create a new XMTP Inbox"
      );
    }
  }, [embeddedWalletAddress]);

  const [signingUp, setSigningUp] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
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
      logger.debug("[passkey onboarding context] Checking smart wallet client");

      logger.debug("[passkey onboarding context] creating new inbox");
      await MultiInboxClient.instance.createNewInboxForPrivySmartContractWallet(
        {
          privySmartWalletClient: smartWalletClient,
        }
      );
      logger.debug(
        "[passkey onboarding context] MultiInboxClient created a new inbox successfully"
      );
      setSigningUp(false);
    }

    createNewInbox();
  }, [smartWalletClient, signingUp]);

  const { user: privyUser } = usePrivy();

  useEffect(() => {
    logger.debug("[passkey onboarding context] privyUser changing", {
      signingUp,
      privyUserId: privyUser?.id,
    });
    if (privyUser?.id && signingUp) {
      createEmbeddedWallet();
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
      await MultiInboxClient.instance.createNewInboxForPrivySmartContractWallet(
        {
          privySmartWalletClient: smartWalletClient,
        }
      );
      useAccountsStore.getState().setAuthStatus(AuthStatuses.signedIn);
      setSigningIn(false);
    }

    initializeWalletForLoggingInAccount();
  }, [signingIn, smartWalletClient]);

  const signupWithPasskey = async () => {
    setSigningIn(false);
    await privyLogout();
    await privySignupWithPasskey({
      relyingParty: RELYING_PARTY,
    });
    setSigningUp(true);
  };

  useEffect(() => {
    if (signingIn) {
      logger.debug("[passkey onboarding context] signing in", {
        signingIn,
      });
    }
  }, [signingIn, smartWalletClient]);

  const loginWithPasskey = async () => {
    setSigningUp(false);
    await privyLogout();
    await privyLoginWithPasskey({
      relyingParty: RELYING_PARTY,
    });
    setSigningIn(true);
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
