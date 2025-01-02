import { useLoginWithSMS as useLoginWithSMSPrivy } from "@privy-io/expo";
import {
  formatPhoneNumberToBeautifulFormat,
  isValidPhoneNumber,
} from "@utils/phone";
import { useCallback } from "react";
import { Alert } from "react-native";

import { usePrivyAuthStore } from "./privyAuthStore";
import { translate } from "../../../i18n";
import logger from "../../../utils/logger";
import { sentryTrackError } from "../../../utils/sentry";

// privy is on the chopping block
// alex is checking on this
export function usePrivySmsLogin() {
  const { loginWithCode: loginWithCodePrivy, sendCode: sendCodePrivy } =
    useLoginWithSMSPrivy();

  const privyAuthStore = usePrivyAuthStore();

  const sendCode = useCallback(async () => {
    const { phone, setLoading, setOtpCode, setStatus } =
      privyAuthStore.getState();

    if (!phone) {
      return false;
    }

    if (!isValidPhoneNumber(phone)) {
      Alert.alert(translate("privyConnect.errors.invalidPhoneNumber"));
      return false;
    }

    const beautifulPhone = formatPhoneNumberToBeautifulFormat(phone);
    if (!beautifulPhone) {
      Alert.alert(translate("privyConnect.errors.invalidPhoneNumber"));
      return false;
    }

    try {
      setLoading(true);
      setOtpCode("");
      await sendCodePrivy({ phone: beautifulPhone });
      setStatus("verify-phone");
      return true;
    } catch (error) {
      sentryTrackError(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [sendCodePrivy, privyAuthStore]);

  const loginWithCode = useCallback(async () => {
    const { setLoading, setPrivyAccountId, phone } = privyAuthStore.getState();

    try {
      setLoading(true);

      const code = privyAuthStore.getState().otpCode;

      if (!code) {
        throw new Error("No code provided");
      }

      const user = await loginWithCodePrivy({ code, phone });

      logger.debug("[Privy sms login] User logged in");

      if (!user) {
        Alert.alert(translate("privyConnect.errors.invalidCode"));
      } else {
        setPrivyAccountId(user.id);
      }
    } catch (error) {
      sentryTrackError(error);
    } finally {
      setLoading(false);
    }
  }, [loginWithCodePrivy, privyAuthStore]);

  return { sendCode, loginWithCode };
}
