import { usePrivy } from "@privy-io/react-auth";

export const useDisconnectFromPrivy = () => {
  const { logout } = usePrivy();
  return logout;
};
