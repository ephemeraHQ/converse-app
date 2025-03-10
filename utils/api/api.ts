import axios from "axios"
import { apiLogger } from "@/utils/logger"
import { config } from "../../config"
import { axiosHeadersInterceptor } from "../../features/authentication/headers.axios-interceptor"

export const api = axios.create({
  baseURL: config.apiURI,
})

// Setup request interceptor for attaching appropriate headers
// depending on the route in the request
api.interceptors.request.use(axiosHeadersInterceptor)

// Debugging interceptors
api.interceptors.request.use((config) => {
  apiLogger.debug(
    `Processing request for URL: ${config.url}, method: ${config.method}, body: ${JSON.stringify(
      config.data ?? "",
    )}, params: ${JSON.stringify(config.params ?? "")}`,
  )

  return config
})
