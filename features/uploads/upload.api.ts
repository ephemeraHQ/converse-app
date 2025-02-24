import { z } from "zod";
import { api } from "@/utils/api/api";
import { logger } from "@/utils/logger";

const PresignedUrlResponseSchema = z.object({
  objectKey: z.string(),
  url: z.string().url(),
});

export type IPresignedUrlResponse = z.infer<typeof PresignedUrlResponseSchema>;

/**
 * Gets a presigned URL for uploading a file to S3
 * @param contentType - The MIME type of the file to upload
 * @returns A presigned URL and object key for the upload
 */
export const getPresignedUploadUrl = async (
  contentType?: string,
): Promise<IPresignedUrlResponse> => {
  logger.debug(
    "[API ATTACHMENTS] Getting presigned URL for content type:",
    contentType,
  );
  const { data } = await api.get("/api/v1/attachments/presigned", {
    params: { contentType },
  });
  logger.debug("[API ATTACHMENTS] getPresignedUploadUrl response:", data);
  return PresignedUrlResponseSchema.parse(data);
};

/**
 * Uploads a file using a presigned URL
 * @param presignedUrl - The presigned URL to upload to
 * @param file - The file to upload
 * @param contentType - The MIME type of the file
 * @returns The public URL of the uploaded file
 */
export const uploadFileWithPresignedUrl = async (
  presignedUrl: string,
  file: Blob | File,
  contentType: string,
): Promise<string> => {
  logger.debug("[API ATTACHMENTS] Uploading file to presigned URL:", {
    presignedUrl,
    contentType,
    fileSize: file.size,
  });
  await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": contentType,
      "x-amz-acl": "public-read",
    },
  });

  // Extract the public URL from the presigned URL
  const fileURL = new URL(presignedUrl);
  const publicUrl = fileURL.origin + fileURL.pathname;
  logger.debug("[API ATTACHMENTS] File uploaded successfully:", { publicUrl });
  return publicUrl;
};

/**
 * Helper function that combines getting a presigned URL and uploading a file
 * @param file - The file to upload
 * @returns The public URL and object key of the uploaded file
 */
export const uploadFile = async (
  file: File,
): Promise<{ publicUrl: string; objectKey: string }> => {
  logger.debug("[API ATTACHMENTS] Starting file upload:", {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  });
  const { url, objectKey } = await getPresignedUploadUrl(file.type);
  const publicUrl = await uploadFileWithPresignedUrl(url, file, file.type);
  logger.debug("[API ATTACHMENTS] File upload completed:", {
    publicUrl,
    objectKey,
  });
  return { publicUrl, objectKey };
};
