import { usePrivy } from "@privy-io/react-auth";

export default () => {
  const { logout } = usePrivy();
  return logout;
};
