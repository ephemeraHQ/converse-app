import { InstalledWallet } from "@components/Onboarding/ConnectViaWallet/ConnectViaWalletSupportedWallets";
import { translate } from "@i18n";

import { SimulateAssetChangesResponse } from "alchemy-sdk";

import { SimulationFailure } from "./TransactionSimulationFailure";
import { SimulationPending } from "./TransactionSimulationPending";
import { TransactionLoader } from "./TransactionContentLoader";
import { TransactionPreviewRow } from "./TransactionPreviewRow";
import { SimulationResult } from "./TransactionSimulationResult";
import { TransactionResult } from "./TransactionResult";
import { shortAddress } from "@utils/strings/shortAddress";

type TransactionState = {
  status: "pending" | "triggering" | "triggered" | "success" | "failure";
  error?: string;
};

type SimulationState = {
  status: "pending" | "success" | "failure";
  result?: SimulateAssetChangesResponse;
  error?: string;
};

type ITransactionContentProps = {
  simulation: SimulationState;
  txState: TransactionState;
  walletApp: InstalledWallet | undefined;
  walletAddress: string | undefined;
  address: string | undefined;
  switchWallet: () => Promise<void>;
};

export const TransactionContent = ({
  simulation,
  txState,
  walletApp,
  walletAddress,
  address,
  switchWallet,
}: ITransactionContentProps) => {
  if (simulation.status === "pending") {
    return <SimulationPending />;
  }

  if (txState.status === "triggering" || txState.status === "triggered") {
    return (
      <TransactionLoader status={txState.status} walletName={walletApp?.name} />
    );
  }

  if (txState.status !== "pending") {
    return <TransactionResult status={txState.status} error={txState.error} />;
  }

  return (
    <>
      {simulation.status === "success" ? (
        <SimulationResult
          changes={simulation.result?.changes}
          walletAddress={walletAddress}
        />
      ) : (
        <SimulationFailure error={simulation.error} />
      )}
      {walletApp && (
        <TransactionPreviewRow
          imageSrc={{ uri: walletApp.iconURL }}
          title={translate("transaction_wallet")}
          subtitle={`${walletApp.name} • ${shortAddress(address || "")}`}
          onPress={switchWallet}
        />
      )}
    </>
  );
};
