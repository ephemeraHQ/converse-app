import { memo, useCallback, useEffect, useState } from "react";

import { usePrivyAuthStoreContext } from "./privyAuthStore";
import Button from "../../../components/Button/Button";
import { translate } from "../../../i18n";
import { sentryTrackError } from "../../../utils/sentry";

export const ResendCodeButton = memo(function ResendCodeButton(props: {
  onPress: () => Promise<boolean>;
}) {
  const { onPress } = props;

  const loading = usePrivyAuthStoreContext((state) => state.loading);

  const [retrySeconds, setRetrySeconds] = useState(60);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (retrySeconds > 0) {
      intervalId = setInterval(() => {
        setRetrySeconds((prevSeconds) => prevSeconds - 1);
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [retrySeconds]);

  const handlePress = useCallback(async () => {
    try {
      if (retrySeconds > 0) return;

      const success = await onPress();

      if (success) {
        setRetrySeconds(60);
      }
    } catch (error) {
      sentryTrackError(error);
    }
  }, [onPress, retrySeconds]);

  return (
    <Button
      variant="text"
      title={
        retrySeconds > 0
          ? `${translate("privyConnect.buttons.resendCode")} (${retrySeconds}s)`
          : translate("privyConnect.buttons.resendCode")
      }
      onPress={handlePress}
      loading={loading}
    />
  );
});
