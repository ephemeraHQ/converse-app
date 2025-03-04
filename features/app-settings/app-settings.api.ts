import { z } from "zod"
import { api } from "@/utils/api/api"
import { captureError } from "@/utils/capture-error"

export const AppConfigSchema = z.object({
  minimumAppVersion: z.object({
    ios: z.string(),
    android: z.string(),
  }),
})

export type IAppConfig = z.infer<typeof AppConfigSchema>

export async function getAppConfig() {
  const { data } = await api.get<IAppConfig>("/api/v1/app-config")

  const result = AppConfigSchema.safeParse(data)

  if (!result.success) {
    captureError(result.error)
  }

  return data
}
