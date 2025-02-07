import { createContext, useContext, useEffect, useState } from "react";
import { useSignupWithPasskey as usePrivySignupWithPasskey } from "@privy-io/expo/passkey";
import { captureErrorWithToast } from "@/utils/capture-error";
import { RELYING_PARTY } from "@/features/onboarding/passkey.constants";
import logger from "@/utils/logger";
import { skipToken, useQuery, queryOptions } from "@tanstack/react-query";
import {
  usePrivy,
  useEmbeddedEthereumWallet,
  usePrivyClient,
} from "@privy-io/expo";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";

const embeddedWalletQueryKey = (args: {
  privyUserId: string | undefined;
  embeddedWalletIndex: number;
}) => ["embeddedWallet", args.privyUserId, args.embeddedWalletIndex];

export function getEmbeddedWalletQueryOptions(args: {
  privyUserId: string | undefined;
  embeddedWalletIndex: number;
  createEmbeddedWallet: (index: number) => Promise<{
    embeddedWalletAddress: string;
  }>;
}) {
  const enabled = !!args.privyUserId;
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

          const { user } = await createEmbeddedWallet({
            createAdditional: true,
          });
          logger.debug(
            `[createEmbeddedWallet] User after create: ${JSON.stringify(
              user,
              null,
              2
            )}`
          );

          const linkedWalletsBefore =
            userBeforeCreate.user?.linked_accounts.filter(
              (account) => account.type === "wallet"
            );
          const linkedWalletsAfter = user.linked_accounts.filter(
            (account) => account.type === "wallet"
          );
          logger.debug(
            `[createEmbeddedWallet] Linked wallets before create: ${JSON.stringify(
              linkedWalletsBefore,
              null,
              2
            )}`
          );
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
    }
  | undefined
>(undefined);
export const SignupWithPasskeyProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { client: smartWalletClient } = useSmartWallets();
  const { logout: privyLogout } = usePrivy();
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

  const {
    data: embeddedWalletAddress,
    error: embeddedWalletError,
    status: embeddedWalletStatus,
  } = /* wont fire until user is logged in*/ useCreateEmbeddedWallet({
    embeddedWalletIndex: 0,
  });

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
        "[OnboardingWelcomeScreenContent] Starting smart wallet client creation timer"
      );
    }
  }, [embeddedWalletAddress, smartWalletClient]);

  useEffect(() => {
    if (smartWalletClient && startTime) {
      const duration = Date.now() - startTime;
      logger.debug(
        `[OnboardingWelcomeScreenContent] Smart wallet client creation took ${duration}ms`
      );
    }
  }, [smartWalletClient, startTime]);

  useEffect(() => {
    if (embeddedWalletAddress) {
      logger.debug(
        "[OnboardingWelcomeScreenContent] Embedded wallet has been created, going to wait for Smart Contract Wallet to be created and then create a new XMTP Inbox"
      );
    }
  }, [embeddedWalletAddress]);

  useEffect(() => {
    if (!smartWalletClient) {
      logger.debug(
        "[OnboardingWelcomeScreenContent] No smart wallet client available yet"
      );
      return;
    }

    logger.debug(
      "[OnboardingWelcomeScreenContent] Smart wallet client available, going to create a new inbox"
    );

    // don't love doing async functions use effects, but let's get this working and then refactor
    async function createNewInbox() {
      logger.debug(
        "[OnboardingWelcomeScreenContent] Checking smart wallet client"
      );

      logger.debug("[signupWithPasskey] creating new inbox");
      await MultiInboxClient.instance.createNewInboxForPrivySmartContractWallet(
        {
          privySmartWalletClient: smartWalletClient,
        }
      );
      logger.debug(
        "[OnboardingWelcomeScreenContent] MultiInboxClient created a new inbox successfully"
      );
    }

    createNewInbox();
  }, [smartWalletClient]);

  const signupWithPasskey = async () => {
    await privyLogout();
    await privySignupWithPasskey({
      relyingParty: RELYING_PARTY,
    });
  };

  return (
    <SignupWithPasskeyContext.Provider value={{ signupWithPasskey }}>
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
