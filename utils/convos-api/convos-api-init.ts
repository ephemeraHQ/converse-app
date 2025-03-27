import { setupAxiosAuthHeadersInterceptor } from "@/features/authentication/auth-headers.axios-interceptor"
import { setupConvosApiDebugInterceptor } from "@/utils/convos-api/convos-api-debug.axios-interceptor"

export function setupConvosApi() {
  setupAxiosAuthHeadersInterceptor()
  setupConvosApiDebugInterceptor()
}
