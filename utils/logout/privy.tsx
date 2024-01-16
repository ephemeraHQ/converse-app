import { usePrivy } from "@privy-io/expo";

export default () => {
  const { logout } = usePrivy();
  return logout;
};
