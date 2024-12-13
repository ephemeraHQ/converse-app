import { useSelect } from "@/data/store/storeHelpers";
import { AnimatedText } from "@/design-system/Text";
import { messageIsSent } from "@/features/conversation/conversation-message-status/conversation-message-status.utils";
import { useMessageContextStoreContext } from "@/features/conversation/conversation-message/conversation-message.store-context";
import { translate } from "@/i18n";
import { useAppTheme } from "@/theme/useAppTheme";
import { DecodedMessageWithCodecsType } from "@/utils/xmtpRN/client.types";
import React, { memo, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type IConversationMessageStatusProps = {
  message: DecodedMessageWithCodecsType;
};

const statusMapping: {
  [key: string]: string | undefined;
} = {
  sent: translate("message_status.sent"),
  delivered: translate("message_status.delivered"),
  error: translate("message_status.error"),
  sending: translate("message_status.sending"),
  prepared: translate("message_status.prepared"),
  seen: translate("message_status.seen"),
};

export const ConversationMessageStatus = memo(
  function ConversationMessageStatus({
    message,
  }: IConversationMessageStatusProps) {
    const { theme } = useAppTheme();

    const { fromMe, isLatestSettledFromMe } = useMessageContextStoreContext(
      useSelect(["fromMe", "isLatestSettledFromMe"])
    );

    const prevStatusRef = useRef(message.status);
    const isSent = messageIsSent(message);

    const [renderText, setRenderText] = useState(false);
    const opacity = useSharedValue(isLatestSettledFromMe ? 1 : 0);
    const height = useSharedValue(isLatestSettledFromMe ? 22 : 0);
    const scale = useSharedValue(isLatestSettledFromMe ? 1 : 0);

    const timingConfig = {
      duration: 200,
      easing: Easing.inOut(Easing.quad),
    };

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      height: height.value,
      transform: [{ scale: scale.value }],
    }));

    useEffect(
      () => {
        const prevStatus = prevStatusRef.current;
        prevStatusRef.current = message.status;

        setTimeout(() => {
          requestAnimationFrame(() => {
            if (
              isSent &&
              (prevStatus === "sending" || prevStatus === "prepared")
            ) {
              opacity.value = withTiming(1, timingConfig);
              height.value = withTiming(22, timingConfig);
              scale.value = withTiming(1, timingConfig);
              setRenderText(true);
            } else if (isSent && !isLatestSettledFromMe) {
              opacity.value = withTiming(0, timingConfig);
              height.value = withTiming(0, timingConfig);
              scale.value = withTiming(0, timingConfig);
              setTimeout(() => setRenderText(false), timingConfig.duration);
            } else if (isLatestSettledFromMe) {
              opacity.value = 1;
              height.value = 22;
              scale.value = 1;
              setRenderText(true);
            }
          });
        }, 100);
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [isLatestSettledFromMe, isSent]
    );

    if (!isLatestSettledFromMe) {
      return null;
    }

    if (!fromMe) {
      return null;
    }

    return (
      <Animated.View
        style={[
          {
            overflow: "hidden",
          },
          animatedStyle,
        ]}
      >
        <View
          style={{
            paddingTop: theme.spacing["4xs"],
          }}
        >
          <AnimatedText color="secondary" size="xxs">
            {renderText && statusMapping[message.status]}
          </AnimatedText>
        </View>
      </Animated.View>
    );
  }
);
