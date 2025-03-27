import { InboxId, RemoteAttachmentMetadata } from "@xmtp/react-native-sdk"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { XMTPError } from "@/utils/error"
import { calculateFileDigest, fileExists } from "@/utils/file-system/file-system"
import { tryCatchWithDuration } from "@/utils/try-catch"
import { getXmtpClientByInboxId } from "../xmtp-client/xmtp-client"
import { XMTP_MAX_MS_UNTIL_LOG_ERROR } from "../xmtp-logs"

export const MAX_AUTOMATIC_DOWNLOAD_ATTACHMENT_SIZE = 10000000 // 10MB

export const encryptAttachment = async (args: {
  fileUri: string
  mimeType: string | undefined
  clientInboxId?: IXmtpInboxId
}) => {
  const { fileUri, mimeType, clientInboxId = getSafeCurrentSender().inboxId } = args

  const client = await getXmtpClientByInboxId({
    inboxId: clientInboxId,
  })

  const encryptResult = await tryCatchWithDuration(
    client.encryptAttachment({
      fileUri,
      mimeType,
    }),
  )

  if (encryptResult.durationMs > XMTP_MAX_MS_UNTIL_LOG_ERROR) {
    captureError(
      new XMTPError({
        error: new Error(`Encrypting attachment took ${encryptResult.durationMs}ms`),
      }),
    )
  }

  if (encryptResult.error) {
    throw new XMTPError({
      error: encryptResult.error,
      additionalMessage: "Failed to encrypt attachment",
    })
  }

  // Calculate and verify content digest
  const digest = await calculateFileDigest(encryptResult.data.encryptedLocalFileUri)

  if (digest !== encryptResult.data.metadata.contentDigest) {
    throw new XMTPError({
      error: new Error("Content digest mismatch"),
      additionalMessage: "The encrypted file appears to be corrupted or modified",
    })
  }

  return encryptResult.data
}

export const decryptAttachment = async (args: {
  encryptedLocalFileUri: string
  metadata: RemoteAttachmentMetadata
  clientInboxId?: IXmtpInboxId
}) => {
  const { encryptedLocalFileUri, metadata, clientInboxId = getSafeCurrentSender().inboxId } = args

  const client = await getXmtpClientByInboxId({
    inboxId: clientInboxId,
  })

  const exists = await fileExists(encryptedLocalFileUri)

  if (!exists) {
    throw new XMTPError({
      error: new Error("Encrypted file not found"),
      additionalMessage: `File not found at path: ${encryptedLocalFileUri}`,
    })
  }

  // Calculate digest directly from the file
  const downloadedDigest = await calculateFileDigest(encryptedLocalFileUri)

  if (metadata.contentDigest !== downloadedDigest) {
    throw new XMTPError({
      error: new Error("Content digest mismatch"),
      additionalMessage: "The downloaded file appears to be corrupted or modified",
    })
  }

  const decryptResult = await tryCatchWithDuration(
    client.decryptAttachment({
      encryptedLocalFileUri,
      metadata,
    }),
  )

  if (decryptResult.durationMs > XMTP_MAX_MS_UNTIL_LOG_ERROR) {
    captureError(
      new XMTPError({
        error: new Error(`Decoding attachment took ${decryptResult.durationMs}ms`),
      }),
    )
  }

  if (decryptResult.error) {
    throw new XMTPError({
      error: decryptResult.error,
      additionalMessage: "Failed to decode attachment",
    })
  }

  return decryptResult.data
}
