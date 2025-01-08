import { LocalAccount } from "viem/accounts";

export type TurnkeyStoreInfo = {
  subOrganizationId: string;
  walletId: string;
  address: string;
};

export type PasskeyState = {
  loading: boolean;
  error: string | null;
  statusString: string | null;
  account: LocalAccount | null;
  turnkeyInfo: TurnkeyStoreInfo | null;
  previousPasskeyName: string | null;
};

export type PasskeySetStateCallback = React.Dispatch<
  React.SetStateAction<PasskeyState>
>;

export type PersistedPasskeyInfo = {
  userId: string;
  walletId: string;
  subOrganizationId: string;
  address: string;
  passkeyName: string;
};
