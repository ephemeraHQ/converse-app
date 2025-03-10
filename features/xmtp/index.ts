import {
  decryptAttachment,
  encryptAttachment,
} from "@/features/xmtp/xmtp-codecs/xmtp-codecs-attachments"

// Trying this pattern to see if it's cleaner.
// Problem so far:
// 1. Finding all references from the original function only show up this file.

export const Xmtp = {
  encryptAttachment,
  decryptAttachment,
}
