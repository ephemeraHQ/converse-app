import { useCurrentAccount } from "../data/store/accountsStore";
import { useGroupPhotoMutation } from "../queries/useGroupPhotoMutation";
import { useGroupPhotoQuery } from "../queries/useGroupPhotoQuery";

export const useGroupPhoto = (topic: string) => {
  const account = useCurrentAccount();
  const { data, isLoading, isError } = useGroupPhotoQuery(account ?? "", topic);
  const { mutateAsync } = useGroupPhotoMutation(account ?? "", topic);

  return {
    groupPhoto: data,
    isLoading,
    isError,
    setGroupPhoto: mutateAsync,
  };
};
