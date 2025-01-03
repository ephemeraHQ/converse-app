import { useQuery } from "@tanstack/react-query";

import { useCurrentAccount } from "@/data/store/accountsStore";
import { getOrBuildXmtpClient } from "@/utils/xmtpRN/sync";

export function useCurrentAccountXmtpClient() {
  const address = useCurrentAccount();
  return useQuery({
    queryKey: ["xmtpClient", address],
    queryFn: () => getOrBuildXmtpClient(address!),
    enabled: !!address,
  });
}
