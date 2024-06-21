import { currentAccount } from "../data/store/accountsStore";
import { useAllowGroupMutation } from "../queries/useAllowGroupMutation";
import { useBlockGroupMutation } from "../queries/useBlockGroupMutation";
import { useGroupConsentQuery } from "../queries/useGroupConsentQuery";

export const useGroupConsent = (topic: string) => {
  const account = currentAccount();
  const { data, isLoading, isError } = useGroupConsentQuery(account, topic);
  const { mutateAsync: allowGroup } = useAllowGroupMutation(account, topic);
  const { mutateAsync: blockGroup } = useBlockGroupMutation(account, topic);

  return {
    consent: data,
    isLoading,
    isError,
    allowGroup,
    blockGroup,
  };
};
