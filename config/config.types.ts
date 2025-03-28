import type { IXmtpEnv } from "@/features/xmtp/xmtp.types"

export type ILoggerColorScheme = "light" | "dark"

export type IConfig = {
  loggerColorScheme: ILoggerColorScheme
  reactQueryPersistCacheIsEnabled: boolean
  debugMenu: boolean
  app: {
    name: string
    version: string
    storeUrl: string
    bundleId: string
    scheme: string
    universalLinks: string[]
    apiUrl: string
    webDomain: string
  }
  firebase: {
    appCheckDebugToken: string
  }
  sentry: {
    dsn: string
  }
  thirdweb: {
    clientId: string
  }
  privy: {
    appId: string
    clientId: string
  }
  evm: {
    rpcEndpoint: string
  }
  xmtp: {
    env: IXmtpEnv
    maxMsUntilLogError: number
  }
}
