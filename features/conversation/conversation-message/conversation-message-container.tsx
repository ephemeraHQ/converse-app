import { useSelect } from "@/data/store/storeHelpers";
import { HStack } from "@/design-system/HStack";
import { useMessageContextStoreContext } from "@/features/conversation/conversation-message/conversation-message.store-context";
import { debugBorder } from "@/utils/debug-style";
import { memo } from "react";

export const MessageContainer = memo(function MessageContainer(props: {
  children: React.ReactNode;
}) {
  const { children } = props;

  const { fromMe } = useMessageContextStoreContext(useSelect(["fromMe"]));

  return (
    <HStack
      // {...debugBorder()}
      style={{
        width: "100%",
        alignItems: "flex-end",
        ...(fromMe
          ? { justifyContent: "flex-end" }
          : { justifyContent: "flex-start" }),
      }}
    >
      {children}
    </HStack>
  );
});
