import { useLoginWithSMS } from "@privy-io/expo";
import {
  formatPhoneNumberToBeautifulFormat,
  isValidPhoneNumber,
} from "@utils/phone";
import { useCallback } from "react";
import { Alert } from "react-native";

import { usePrivyAuthStore, usePrivyAuthStoreContext } from "./privyAuthStore";
import { translate } from "../../../i18n";
import { sentryTrackError } from "../../../utils/sentry";

export function usePrivySmsLogin() {
  const { loginWithCode: loginWithCodePrivy, sendCode: sendCodePrivy } =
    useLoginWithSMS();

  const setLoading = usePrivyAuthStoreContext((state) => state.setLoading);
  const setOtpCode = usePrivyAuthStoreContext((state) => state.setOtpCode);
  const setStatus = usePrivyAuthStoreContext((state) => state.setStatus);
  const setPrivyAccountId = usePrivyAuthStoreContext(
    (state) => state.setPrivyAccountId
  );

  const privyAuthStore = usePrivyAuthStore();

  const sendCode = useCallback(async () => {
    const phone = privyAuthStore.getState().phone;
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
  }, [sendCodePrivy, setLoading, setOtpCode, setStatus, privyAuthStore]);

  const loginWithCode = useCallback(async () => {
    try {
      setLoading(true);
      const code = privyAuthStore.getState().otpCode;
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
  }, [loginWithCodePrivy, setLoading, setPrivyAccountId, privyAuthStore]);

  return { sendCode, loginWithCode };
}
