import { createThirdwebClient } from "thirdweb"
import { config } from "../config"

export const thirdwebClient = createThirdwebClient({
  clientId: config.thirdweb.clientId,
})
