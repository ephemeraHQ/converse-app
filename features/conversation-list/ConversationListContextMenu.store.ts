import { create } from "zustand";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { TableViewItemType } from "@/components/TableView/TableView";

type IConversationListContextMenuState = {
  conversationTopic: ConversationTopic | undefined;
  menuItems: TableViewItemType[];
};

const initialMessageReactionsState: IConversationListContextMenuState = {
  conversationTopic: undefined,
  menuItems: [],
};

export const useConversationListContextMenuStore =
  create<IConversationListContextMenuState>((set) => ({
    conversationTopic: initialMessageReactionsState.conversationTopic,
    setConversationTopic: (conversationTopic: ConversationTopic | undefined) =>
      set({ conversationTopic }),
    menuItems: initialMessageReactionsState.menuItems,
    setMenuItems: (menuItems: TableViewItemType[]) => set({ menuItems }),
  }));

export const resetConversationListContextMenuStore = () => {
  useConversationListContextMenuStore.setState(initialMessageReactionsState);
};

export const setConversationListContextMenuConversationData = (
  conversationTopic: ConversationTopic,
  menuItems: TableViewItemType[]
) => {
  useConversationListContextMenuStore.setState({
    conversationTopic,
    menuItems,
  });
};

export const useConversationListContextMenuIsVisible = () => {
  const { conversationTopic } = useConversationListContextMenuStore();
  return conversationTopic !== undefined;
};

export const useConversationListContextMenuItems = () => {
  const { menuItems } = useConversationListContextMenuStore();
  return menuItems;
};

export const useConversationListContextMenuConversationTopic = () => {
  const { conversationTopic } = useConversationListContextMenuStore();
  return conversationTopic;
};
