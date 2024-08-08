import { MessageToDisplay } from "@components/Chat/Message/Message";
import { MessageReaction } from "@utils/reactions";
import { FC } from "react";

interface MessageContextMenuWrapperProps {
  message: MessageToDisplay;
  messageContent: React.ReactNode;
  children: React.ReactNode;
  reactions: {
    [senderAddress: string]: MessageReaction[];
  };
}

export const MessageContextMenuWrapper: FC<MessageContextMenuWrapperProps> = ({
  children,
}) => {
  return <>{children}</>;
};
