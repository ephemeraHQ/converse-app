import RNFetchBlob from "rn-fetch-blob"
import { z } from "zod"
import { captureError } from "@/utils/capture-error"
import { convosApi } from "@/utils/convos-api/convos-api-instance"
import { normalizeFilePath } from "@/utils/file-system/file-system"

const PresignedUrlResponseSchema = z.object({
  objectKey: z.string(),
  url: z.string().url(),
})

export type IPresignedUrlResponse = z.infer<typeof PresignedUrlResponseSchema>

/**
 * Gets a presigned URL for uploading a file to S3
 * @param contentType - The MIME type of the file to upload
 * @returns A presigned URL and object key for the upload
 */
async function getPresignedUploadUrl(args: { contentType?: string }) {
  const { contentType } = args

  const { data } = await convosApi.get<IPresignedUrlResponse>("/api/v1/attachments/presigned", {
    params: { contentType },
  })

  const result = PresignedUrlResponseSchema.safeParse(data)

  if (!result.success) {
    captureError(result.error)
  }

  return data
}

export async function uploadFile(args: { filePath: string; contentType: string | undefined }) {
  const { filePath, contentType } = args

  const { url: presignedUrl } = await getPresignedUploadUrl({ contentType })

  const normalizedPath = normalizeFilePath(filePath)

  await RNFetchBlob.fetch(
    "PUT",
    presignedUrl,
    {
      "Content-Type": "application/octet-stream",
      "x-amz-acl": "public-read",
    },
    RNFetchBlob.wrap(normalizedPath),
  )

  // Extracts the public URL from a presigned URL by removing query parameters
  const fileURL = new URL(presignedUrl)
  const publicUrl = fileURL.origin + fileURL.pathname

  return publicUrl
}
