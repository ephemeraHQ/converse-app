import { useCurrentAccount } from "@data/store/accountsStore";
import { translate } from "@i18n";
import { getPreferredAvatar, getPreferredName } from "@utils/profile";
import { SimulateChangeType, SimulateAssetChangesResponse } from "alchemy-sdk";
import { useMemo } from "react";
import { View } from "react-native";

import TransactionSend from "../../assets/transaction-send.png";
import TransactionTo from "../../assets/transaction-to.png";
import { TransactionPreviewRow } from "./TransactionPreviewRow";
import { useProfilesSocials } from "@/hooks/useProfilesSocials";

type SimulationResultProps = {
  changes: SimulateAssetChangesResponse["changes"] | undefined;
  walletAddress: string | undefined;
};

export const SimulationResult = ({
  changes,
  walletAddress,
}: SimulationResultProps) => {
  const accountAddress = useCurrentAccount() as string;

  const myChanges = useMemo(() => {
    const myAddresses = [accountAddress.toLowerCase()];
    if (walletAddress) {
      myAddresses.push(walletAddress.toLowerCase());
    }
    return changes?.filter((change) =>
      myAddresses.some(
        (a) => a === change.to.toLowerCase() || a === change.from.toLowerCase()
      )
    );
  }, [accountAddress, changes, walletAddress]);

  const changeToSocials = useProfilesSocials(
    myChanges?.map((change) => change.to) ?? []
  );

  return (
    <>
      {myChanges?.map((change, index) => {
        const changeToSocial = changeToSocials[index]?.data;
        return (
          <View key={`${change.contractAddress}-${index}`}>
            <TransactionPreviewRow
              title={
                change.changeType === SimulateChangeType.APPROVE
                  ? translate("transaction_asset_change_type_approve")
                  : translate("transaction_asset_change_type_transfer")
              }
              subtitle={`${change.amount} ${change.symbol}`}
              imageSrc={change.logo ? { uri: change.logo } : TransactionSend}
              imagePlaceholder={TransactionSend}
            />
            <TransactionPreviewRow
              title={translate("transaction_asset_change_to")}
              subtitle={getPreferredName(changeToSocial, change.to)}
              imageSrc={getPreferredAvatar(changeToSocial) || TransactionTo}
              imagePlaceholder={TransactionTo}
            />
          </View>
        );
      })}
    </>
  );
};
