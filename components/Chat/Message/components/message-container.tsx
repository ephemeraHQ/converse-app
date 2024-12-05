import { HStack } from "@/design-system/HStack";
import { useAppTheme } from "@/theme/useAppTheme";
import { memo } from "react";

export const MessageContainer = memo(function MessageContainer(props: {
  children: React.ReactNode;
  fromMe: boolean;
}) {
  const { children, fromMe } = props;

  const { theme } = useAppTheme();

  return (
    <HStack
      style={{
        // ...debugBorder("blue"),
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
