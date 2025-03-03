import axios from "axios"
import { apiLogger } from "@/utils/logger"
import { config } from "../../config"
import { headersInterceptor } from "../../features/authentication/interceptor.headers"

export const api = axios.create({
  baseURL: config.apiURI,
})

// Setup request interceptor for attaching appropriate headers
// depending on the route in the request
api.interceptors.request.use(headersInterceptor)

// Debugging interceptors
api.interceptors.request.use((config) => {
  apiLogger.debug(
    `Processing request for URL: ${config.url}, method: ${config.method}, body: ${JSON.stringify(
      config.data ?? "",
    )}, params: ${JSON.stringify(config.params ?? "")}`,
  )

  return config
})
