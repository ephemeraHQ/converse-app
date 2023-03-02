import { WalletConnectProviderProps } from "../types";
export default function WalletConnectProvider({
  children,
  renderQrcodeModal: maybeRenderQrcodeModal,
  ...extras
}: Partial<WalletConnectProviderProps>): JSX.Element;
