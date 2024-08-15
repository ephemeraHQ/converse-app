import { useCurrentAccount } from "@data/store/accountsStore";
import { MutationOptions, useMutation } from "@tanstack/react-query";
import { createGroupJoinRequest, GroupJoinRequest } from "@utils/api";

export const useCreateGroupJoinRequestMutation = (
  options: MutationOptions<
    Pick<GroupJoinRequest, "id">,
    Error,
    string,
    unknown
  > = {}
) => {
  const account = useCurrentAccount() as string;

  return useMutation({
    ...options,
    mutationFn: async (groupInviteId: string) => {
      return createGroupJoinRequest(account, groupInviteId);
    },
  });
};
