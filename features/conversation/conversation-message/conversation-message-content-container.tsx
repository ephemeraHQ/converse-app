import { useMessageContextStoreContext } from "@/features/conversation/conversation-message/conversation-message.store-context";
import { useSelect } from "@/data/store/storeHelpers";
import { HStack } from "@/design-system/HStack";
import { useAppTheme } from "@/theme/useAppTheme";
import { memo } from "react";

export const MessageContentContainer = memo(
  function MessageContentContainer(props: { children: React.ReactNode }) {
    const { children } = props;

    const { theme } = useAppTheme();

    const { fromMe } = useMessageContextStoreContext(useSelect(["fromMe"]));

    return (
      <HStack
        style={{
          // ...debugBorder("yellow"),
          alignItems: "flex-end",
          ...(fromMe
            ? { paddingRight: theme.spacing.sm, justifyContent: "flex-end" }
            : { paddingLeft: theme.spacing.sm, justifyContent: "flex-start" }),
        }}
      >
        {children}
      </HStack>
    );
  }
);
