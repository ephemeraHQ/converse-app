import { api } from "@/utils/api/api"

export const getPresignedUriForUpload = async (contentType?: string | undefined) => {
  const { data } = await api.get("/api/attachment/presigned", {
    params: { contentType },
  })
  return data as { objectKey: string; url: string }
}
