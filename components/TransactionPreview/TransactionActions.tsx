import { Button } from "@design-system/Button/Button";
import { translate } from "@i18n";

import { TransactionToTrigger } from "./TransactionPreview";
import { InstalledWallet } from "../Onboarding/supportedWallets";

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
      <Button
        variant="fill"
        text={translate("transaction_switch_chain", {
          chainName: transactionToPreview?.chainId,
        })}
        onPress={
          transactionToPreview?.chainId
            ? () => switchChain(transactionToPreview.chainId)
            : undefined
        }
      />
    )}
    {showTriggerButton && (
      <Button
        text={translate("transaction_pending", {
          wallet: walletApp?.name,
        })}
        variant="fill"
        onPress={trigger}
      />
    )}
  </>
);
