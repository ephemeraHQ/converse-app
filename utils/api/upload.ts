import { getXmtpApiHeaders } from "@/utils/api/auth";
import { oldApi } from "@/utils/api/api";

export const getPresignedUriForUpload = async (
  userAddress: string,
  contentType?: string | undefined
) => {
  const { data } = await oldApi.get("/api/attachment/presigned", {
    params: { contentType },
    headers: await getXmtpApiHeaders(userAddress),
  });
  return data as { objectKey: string; url: string };
};
