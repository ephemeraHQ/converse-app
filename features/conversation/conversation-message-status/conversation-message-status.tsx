import { AnimatedHStack } from "@/design-system/HStack";
import { AnimatedText } from "@/design-system/Text";
import { usePrevious } from "@/hooks/use-previous-value";
import { translate } from "@/i18n";
import { useAppTheme } from "@/theme/useAppTheme";
import { Haptics } from "@/utils/haptics";
import React, { memo, useEffect } from "react";
import { IConversationMessageStatus } from "../conversation-message/conversation-message.types";

type IConversationMessageStatusProps = {
  status: IConversationMessageStatus;
};

const statusMapping: Record<IConversationMessageStatus, string> = {
  // sending: translate("message_status.sending"),
  sending: " ", // For now don't show anything for sending, waiting to see what UX we want
  sent: translate("message_status.sent"),
  error: translate("message_status.error"),
};

export const ConversationMessageStatus = memo(
  function ConversationMessageStatus({
    status,
  }: IConversationMessageStatusProps) {
    const { theme } = useAppTheme();

    const previousStatus = usePrevious(status);

    useEffect(() => {
      if (previousStatus === "sending" && status === "sent") {
        Haptics.softImpactAsync();
      }
    }, [status, previousStatus]);

    return (
      <AnimatedHStack
        // {...debugBorder()}
        entering={theme.animation.reanimatedFadeInSpring}
      >
        <AnimatedText color="secondary" size="xxs">
          {statusMapping[status]}
        </AnimatedText>
      </AnimatedHStack>
    );
  }
);
