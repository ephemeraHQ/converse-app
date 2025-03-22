import { z } from "zod"
import { captureError } from "@/utils/capture-error"
import { convosApi } from "@/utils/convos-api/convos-api-instance"

export const AppConfigSchema = z.object({
  minimumAppVersion: z.object({
    ios: z.string(),
    android: z.string(),
  }),
})

export type IAppConfig = z.infer<typeof AppConfigSchema>

export async function getAppConfig() {
  const { data } = await convosApi.get<IAppConfig>("/api/v1/app-config")

  const result = AppConfigSchema.safeParse(data)

  if (!result.success) {
    captureError(result.error)
  }

  return data
}
