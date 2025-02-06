export const MultiInboxClientRestorationStates = {
  idle: "idle",
  restoring: "restoring",
  restored: "restored",
  error: (msg: string) => ({ error: msg }),
} as const;

type ValueOf<T> = T[keyof T];

type StaticStates = Exclude<
  ValueOf<typeof MultiInboxClientRestorationStates>,
  Function
>;

export type MultiInboxClientRestorationState =
  | StaticStates
  | ReturnType<typeof MultiInboxClientRestorationStates.error>;

export type CurrentSender = {
  ethereumAddress: string;
  xmtpInboxId: string;
};
