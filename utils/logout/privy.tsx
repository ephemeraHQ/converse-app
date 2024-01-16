import { usePrivy } from "@privy-io/expo";

export const useDisconnectFromPrivy = () => {
  const { logout } = usePrivy();
  return logout;
};
