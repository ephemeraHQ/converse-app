import { logger } from "@/utils/logger"

/**
 * Deep link URL parsing
 * Takes a URL string and extracts information needed for handling deep links
 * 
 * @param url The URL to parse
 * @returns An object with parsed information from the URL, including:
 *   - path: The path of the URL
 *   - segments: The path segments
 *   - params: URL query parameters
 */
export function parseURL(url: string) {
  try {
    const parsedURL = new URL(url)
    logger.info(`Parsing deep link URL: ${url}`)
    
    // Extract the path without leading slash
    const path = parsedURL.pathname.replace(/^\/+/, "")
    
    // Split path into segments
    const segments = path.split("/").filter(Boolean)
    
    // Parse query parameters
    const params: Record<string, string> = {}
    parsedURL.searchParams.forEach((value, key) => {
      params[key] = value
    })
    
    return {
      path,
      segments,
      params
    }
  } catch (error) {
    logger.warn(`Error parsing URL: ${url}, error: ${error}`)
    return {
      path: "",
      segments: [],
      params: {}
    }
  }
} 