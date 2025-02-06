import { createContext, useContext } from "react";
import { useSignupWithPasskey as usePrivySignupWithPasskey } from "@privy-io/expo/passkey";
import { useNavigation } from "@react-navigation/native";
import { captureErrorWithToast } from "@/utils/capture-error";
import { RELYING_PARTY } from "@/features/onboarding/passkey.constants";
import logger from "@/utils/logger";

type SignupWithPasskeyContextType = {
  signupWithPasskey: () => Promise<void>;
};

const SignupWithPasskeyContext = createContext<
  SignupWithPasskeyContextType | undefined
>(undefined);

export function SignupWithPasskeyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigation = useNavigation();

  const { signupWithPasskey: privySignupWithPasskey } =
    usePrivySignupWithPasskey({
      onSuccess: (privyUser, isNewUser) => {
        logger.debug(
          "[OnboardingWelcomeScreenContent] Successfully signed up with passkey, going to create a new embedded wallet (which will in turn automatically create a new Smart Contract Wallet)",
          privyUser,
          isNewUser
        );
        // @ts-ignore
        navigation.replace("OnboardingCreateContactCard");
      },
      onError: (error) => {
        logger.error(
          "[OnboardingWelcomeScreenContent] Error signing up with passkey",
          error
        );
        captureErrorWithToast(error);
      },
    });

  const signupWithPasskey = async () => {
    await privySignupWithPasskey({
      relyingParty: RELYING_PARTY,
    });
  };

  return (
    <SignupWithPasskeyContext.Provider value={{ signupWithPasskey }}>
      {children}
    </SignupWithPasskeyContext.Provider>
  );
}

export const useSignupWithPasskey = () => {
  const context = useContext(SignupWithPasskeyContext);
  if (!context) {
    throw new Error(
      "useSignupWithPasskey must be used within a SignupWithPasskeyProvider"
    );
  }
  return context;
};
