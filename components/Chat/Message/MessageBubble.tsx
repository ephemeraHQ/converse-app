import { useMessageContextStoreContext } from "@components/Chat/Message/messageContextStore";
import { ClickableText } from "@components/ClickableText";
import { HStack } from "@design-system/HStack";
import { useAppTheme } from "@theme/useAppTheme";

type IMessageBubbleProps = {
  content?: string;
};

export const BubbleContainer = ({
  children,
  fromMe,
}: {
  children: React.ReactNode;
  fromMe: boolean;
}) => {
  const { theme } = useAppTheme();

  return (
    <HStack
      style={{
        // ...debugBorder("red"),
        flex: 1,
        ...(fromMe
          ? { justifyContent: "flex-end" }
          : { justifyContent: "flex-start" }),
      }}
    >
      {children}
    </HStack>
  );
};

type IBubbleContentContainerProps = {
  children: React.ReactNode;
  fromMe: boolean;
  hasNextMessageInSeries: boolean;
  showDateChange: boolean;
  hasPreviousMessageInSeries: boolean;
};

export const BubbleContentContainer = (args: IBubbleContentContainerProps) => {
  const {
    children,
    fromMe,
    hasNextMessageInSeries,
    showDateChange,
    hasPreviousMessageInSeries,
  } = args;
  const { theme } = useAppTheme();

  return (
    <HStack
      style={[
        {
          backgroundColor: fromMe
            ? theme.colors.bubbles.bubble
            : theme.colors.bubbles.received.bubble,
          borderRadius: theme.borderRadius.sm,
          paddingHorizontal: theme.spacing.xs,
          paddingVertical: theme.spacing.xxs,
        },
        !hasNextMessageInSeries && {
          borderBottomLeftRadius: theme.spacing["4xs"],
        },
        fromMe &&
          (!hasNextMessageInSeries ||
            showDateChange ||
            hasPreviousMessageInSeries) && {
            borderBottomLeftRadius: theme.spacing.sm,
            borderBottomRightRadius: theme.spacing["4xs"],
          },
      ]}
    >
      {children}
    </HStack>
  );
};

export const MessageBubble = ({ content }: IMessageBubbleProps) => {
  const { theme } = useAppTheme();
  const {
    fromMe,
    hasNextMessageInSeries,
    showDateChange,
    hasPreviousMessageInSeries,
  } = useMessageContextStoreContext((state) => ({
    fromMe: state.fromMe,
    hasNextMessageInSeries: state.hasNextMessageInSeries,
    showDateChange: state.showDateChange,
    hasPreviousMessageInSeries: state.hasPreviousMessageInSeries,
  }));

  return (
    <BubbleContainer fromMe={fromMe}>
      <BubbleContentContainer
        fromMe={fromMe}
        hasNextMessageInSeries={hasNextMessageInSeries}
        showDateChange={showDateChange}
        hasPreviousMessageInSeries={hasPreviousMessageInSeries}
      >
        <ClickableText
          style={{
            color: fromMe
              ? theme.colors.text.inverted.primary
              : theme.colors.text.primary,
          }}
        >
          {content}
        </ClickableText>
      </BubbleContentContainer>
    </BubbleContainer>
  );
};
