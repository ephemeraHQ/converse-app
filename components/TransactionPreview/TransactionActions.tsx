import { InstalledWallet } from "@components/Onboarding/ConnectViaWallet/ConnectViaWalletSupportedWallets";
import { Text } from "@design-system/Text";
import { TouchableOpacity } from "@design-system/TouchableOpacity";
import { VStack } from "@design-system/VStack";
import { translate } from "@i18n";
import { spacing } from "@theme/spacing";

import { TransactionToTrigger } from "./TransactionPreview";
import TransactionNext from "../../assets/transaction-next.svg";
import { CHAIN_BY_ID } from "@utils/evm/wallets";

type ITransactionActionsProps = {
  shouldSwitchChain?: boolean;
  showTriggerButton?: boolean;
  transactionToPreview: TransactionToTrigger | undefined;
  switchChain: (chainId: number) => Promise<void>;
  trigger: () => Promise<void>;
  walletApp: InstalledWallet | undefined;
};

export const TransactionActions = ({
  shouldSwitchChain,
  showTriggerButton,
  transactionToPreview,
  switchChain,
  trigger,
  walletApp,
}: ITransactionActionsProps) => (
  <>
    {shouldSwitchChain && (
      <VStack style={{ alignItems: "center" }}>
        <TouchableOpacity
          onPress={
            transactionToPreview?.chainId
              ? () => switchChain(transactionToPreview.chainId)
              : undefined
          }
        >
          <TransactionNext />
        </TouchableOpacity>
        <Text
          preset="smaller"
          color="secondary"
          style={{ marginTop: spacing.xs }}
        >
          {translate("transaction_switch_chain", {
            chainName: transactionToPreview?.chainId
              ? CHAIN_BY_ID[transactionToPreview.chainId].name
              : undefined,
            wallet: walletApp?.name,
          })}
        </Text>
      </VStack>
    )}
    {showTriggerButton && (
      <VStack style={{ alignItems: "center" }}>
        <TouchableOpacity onPress={trigger}>
          <TransactionNext />
        </TouchableOpacity>
        <Text
          preset="smaller"
          color="secondary"
          style={{ marginTop: spacing.xs }}
        >
          {translate("transaction_pending", {
            wallet: walletApp?.name,
          })}
        </Text>
      </VStack>
    )}
  </>
);
