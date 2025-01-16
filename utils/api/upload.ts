import { getXmtpApiHeaders } from "@/utils/api/auth";
import { api } from "@/utils/api/api";
import { getPrivyRequestHeaders } from "@/utils/evm/privy";

export const getPresignedUriForUpload = async (
  userAddress: string | undefined,
  contentType?: string | undefined
) => {
  const { data } = await api.get("/api/attachment/presigned", {
    params: { contentType },
    headers: userAddress
      ? await getXmtpApiHeaders(userAddress)
      : getPrivyRequestHeaders(),
  });
  return data as { objectKey: string; url: string };
};
