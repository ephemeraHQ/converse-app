import { MessageToDisplay } from "@components/Chat/Message/Message";
import { MessageReaction } from "@utils/reactions";
import React, { FC } from "react";

interface MessageContextMenuWrapperProps {
  message: MessageToDisplay;
  messageContent: React.ReactNode;
  children: React.ReactNode;
  reactions: {
    [senderAddress: string]: MessageReaction | undefined;
  };
}

export const MessageContextMenuWrapperIOS: FC<
  MessageContextMenuWrapperProps
> = ({ children }) => {
  return <>{children}</>;
};
