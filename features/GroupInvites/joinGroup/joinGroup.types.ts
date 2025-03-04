export type JoinGroupResult =
  | { type: "group-join-request.accepted"; groupId: string }
  | { type: "group-join-request.already-joined"; groupId: string }
  | { type: "group-join-request.rejected" }
  | { type: "group-join-request.error" }
  | { type: "group-join-request.timed-out" }

export type JoinGroupResultType = JoinGroupResult["type"]
