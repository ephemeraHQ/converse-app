import axios from "axios"
import { config } from "../../config"

export const convosApi = axios.create({
  baseURL: config.app.apiUrl,
})
