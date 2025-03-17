import * as Crypto from "expo-crypto"
import { IXmtpInboxId, IXmtpMessageId } from "@/features/xmtp/xmtp.types"

/**
 * Generates a deterministic message ID based on sender and content
 * This ensures optimistic and real messages have the same ID
 */
export async function generateDeterministicMessageId(args: {
  senderInboxId: IXmtpInboxId
  content: string
}) {
  const { senderInboxId, content } = args

  // Create a string that combines all the deterministic parts of the message
  const idString = `${senderInboxId}:${content}`

  // Create a hash of this string to get a consistent ID
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, idString)

  return hash as unknown as IXmtpMessageId
}
