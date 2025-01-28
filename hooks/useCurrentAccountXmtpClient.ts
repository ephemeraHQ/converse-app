import { useQuery } from "@tanstack/react-query";

import { useCurrentAccount } from "@/data/store/accountsStore";
import { getXmtpClient } from "@/utils/xmtpRN/xmtp-client/xmtp-client";

export function useCurrentAccountXmtpClient() {
  const address = useCurrentAccount();
  return useQuery({
    queryKey: ["xmtpClient", address],
    queryFn: () => getXmtpClient(address!),
    enabled: !!address,
  });
}
