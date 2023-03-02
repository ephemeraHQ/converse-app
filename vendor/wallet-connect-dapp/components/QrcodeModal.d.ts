import { RenderQrcodeModalProps } from "../types";
export default function QrcodeModal({
  visible,
  walletServices,
  connectToWalletService,
  uri,
  onDismiss,
  division,
}: RenderQrcodeModalProps & {
  readonly division: number;
}): JSX.Element;
