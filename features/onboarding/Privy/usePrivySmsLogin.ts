import { useLoginWithSMS } from "@privy-io/expo";
import {
  formatPhoneNumberToBeautifulFormat,
  isValidPhoneNumber,
} from "@utils/phone";
import { useCallback } from "react";
import { Alert } from "react-native";

import { usePrivyConnectStore } from "./privyAuthStore";
import { translate } from "../../../i18n";
import { sentryTrackError } from "../../../utils/sentry";

export function usePrivySmsLogin() {
  const { loginWithCode: loginWithCodePrivy, sendCode: sendCodePrivy } =
    useLoginWithSMS();
  const { setLoading, setOtpCode, setStatus, setPrivyAccountId } =
    usePrivyConnectStore();

  const sendCode = useCallback(async () => {
    const phone = usePrivyConnectStore.getState().phone;
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
  }, [sendCodePrivy, setLoading, setOtpCode, setStatus]);

  const loginWithCode = useCallback(async () => {
    try {
      setLoading(true);
      const code = usePrivyConnectStore.getState().otpCode;
      const user = await loginWithCodePrivy({ code });

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
  }, [loginWithCodePrivy, setLoading, setPrivyAccountId]);

  return { sendCode, loginWithCode };
}
