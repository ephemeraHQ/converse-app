import { convosApi } from "@/utils/convos-api/convos-api-instance"
import { apiLogger } from "@/utils/logger"

export function setupConvosApiDebugInterceptor() {
  convosApi.interceptors.request.use((config) => {
    apiLogger.debug(
      `New API request. URL: ${config.url}, method: ${config.method}, body: ${JSON.stringify(
        config.data ?? "",
      )}, params: ${JSON.stringify(config.params ?? "")}`,
    )

    return config
  })
}
