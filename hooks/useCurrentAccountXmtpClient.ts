import { useQuery } from "@tanstack/react-query";

import { useCurrentAccount } from "@/data/store/accountsStore";
import { getXmtpClient } from "@/utils/xmtpRN/sync";

export function useCurrentAccountXmtpClient() {
  const address = useCurrentAccount();
  return useQuery({
    queryKey: ["xmtpClient", address],
    queryFn: () => getXmtpClient(address!),
    enabled: !!address,
  });
}
