// import { useCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
// import { MutationOptions, useMutation } from "@tanstack/react-query";
// import {
//   createGroupJoinRequest,
//   GroupJoinRequest,
// } from "@/utils/api/api-groups/api-groups";

// export const useCreateGroupJoinRequestMutation = (
//   options: MutationOptions<
//     Pick<GroupJoinRequest, "id">,
//     Error,
//     string,
//     unknown
//   > = {}
// ) => {
//   const account = useCurrentAccount() as string;

//   return useMutation({
//     ...options,
//     mutationFn: async (groupInviteId: string) => {
//       return createGroupJoinRequest(account, groupInviteId);
//     },
//   });
// };
