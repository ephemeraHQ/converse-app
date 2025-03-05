import { useMutation } from "@tanstack/react-query"
import { addGroupMembers } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-group"

export function useAddGroupMembers() {
  return useMutation({
    mutationFn: addGroupMembers,
  })
}
