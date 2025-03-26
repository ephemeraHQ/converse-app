import { config } from "@/config"
import { captureError } from "@/utils/capture-error"
import { XMTPError } from "@/utils/error"

export function logErrorIfXmtpRequestTookTooLong(args: {
  durationMs: number
  xmtpFunctionName: string
}) {
  const { durationMs, xmtpFunctionName } = args

  if (durationMs > config.xmtp.maxMsUntilLogError) {
    captureError(
      new XMTPError({
        error: new Error(`Calling "${xmtpFunctionName}" took ${durationMs}ms`),
      }),
    )
  }
}
