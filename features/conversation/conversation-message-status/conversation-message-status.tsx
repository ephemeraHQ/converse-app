import { Center } from "@/design-system/Center";
import { AnimatedHStack } from "@/design-system/HStack";
import { Icon } from "@/design-system/Icon/Icon";
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

export const ConversationMessageStatus = memo(
  function ConversationMessageStatus({
    status,
  }: IConversationMessageStatusProps) {
    const previousStatus = usePrevious(status);

    useEffect(() => {
      if (previousStatus === "sending" && status === "sent") {
        Haptics.softImpactAsync();
      }
    }, [status, previousStatus]);

    if (status === "sending") {
      return <SendingStatus />;
    }

    if (status === "sent") {
      return <SentStatus />;
    }

    return null;
  }
);

const StatusContainer = memo(function StatusContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useAppTheme();

  return (
    <AnimatedHStack
      entering={theme.animation.reanimatedFadeInSpring}
      style={{
        alignItems: "center",
        columnGap: theme.spacing.xxxs,
        paddingTop: theme.spacing.xxxs,
      }}
    >
      {children}
    </AnimatedHStack>
  );
});

const StatusText = memo(function StatusText({ text }: { text: string }) {
  return (
    <AnimatedText color="secondary" size="xxs">
      {text}
    </AnimatedText>
  );
});

const StatusIconContainer = memo(function StatusIconContainer({
  children,
}: {
  children?: React.ReactNode;
}) {
  const { theme } = useAppTheme();

  return (
    <Center
      style={{
        width: 14,
        height: 14,
        padding: 1,
      }}
    >
      {children}
    </Center>
  );
});

const SendingStatus = memo(function SendingStatus() {
  return (
    <StatusContainer>
      <StatusText text=" " />
      <StatusIconContainer />
    </StatusContainer>
  );
});

const SentStatus = memo(function SentStatus() {
  const { theme } = useAppTheme();

  return (
    <StatusContainer>
      <StatusText text={translate("message_status.sent")} />
      <StatusIconContainer>
        <Icon
          icon="checkmark"
          size={theme.iconSize.xs}
          color={theme.colors.text.secondary}
        />
      </StatusIconContainer>
    </StatusContainer>
  );
});
