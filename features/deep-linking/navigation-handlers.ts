import { getStateFromPath as defaultGetStateFromPath } from "@react-navigation/native"
import { logger } from "@/utils/logger"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { navigationRef } from "@/navigation/navigation.utils"
import { checkConversationExists } from "./conversation-links"

/**
 * Custom getStateFromPath function to handle deep links for the app
 * This is used by React Navigation's linking configuration to convert URLs to navigation state
 * 
 * @param path The URL path to convert to navigation state
 * @param options Options for the getStateFromPath function
 * @returns A navigation state object based on the URL
 */
export const getStateFromPath = (path: string, options: Parameters<typeof defaultGetStateFromPath>[1]) => {
  // First get the default state from React Navigation
  const state = defaultGetStateFromPath(path, options)
  
  // If we don't have a state, or the state doesn't contain routes, just return it as is
  if (!state || !state.routes || state.routes.length === 0) {
    return state
  }
  
  // Find the conversation route if it exists
  const conversationRoute = state.routes.find(route => route.name === 'Conversation')
  
  // If there's no conversation route, return the state unchanged
  if (!conversationRoute) {
    return state
  }
  
  // Type assertion for the params
  const params = conversationRoute.params as Record<string, unknown> | undefined
  
  // If we have an inboxId param, we need to handle it specially
  if (params && typeof params.inboxId === 'string') {
    const inboxId = params.inboxId as IXmtpInboxId
    const composerTextPrefill = typeof params.composerTextPrefill === 'string' 
      ? params.composerTextPrefill 
      : undefined
    
    logger.info(`Deep link handler: Processing conversation for inboxId: ${inboxId}${
      composerTextPrefill ? ` with text: ${composerTextPrefill}` : ''
    }`)
    
    // We need to check if a conversation exists with this inboxId
    // Since we can't make this function async, we'll set up initial parameters
    // for a new conversation, and our deep link handler will update it if needed
    
    // Start checking if a conversation exists - this runs in parallel
    checkConversationExists(inboxId)
      .then(({ exists, conversationId }) => {
        if (exists && conversationId) {
          // We found an existing conversation, navigate to it
          logger.info(`Deep link handler: Found existing conversation, navigating to: ${conversationId}`)
          navigationRef.current?.navigate("Conversation", {
            xmtpConversationId: conversationId,
            isNew: false,
            composerTextPrefill
          })
        }
      })
      .catch(error => {
        logger.error(`Deep link handler: Error checking conversation existence: ${error}`)
      })
    
    // Initially set up parameters for a new conversation, but we'll override
    // this with the navigation call above if we find an existing conversation
    const updatedRoutes = state.routes.map(route => {
      if (route.name === 'Conversation') {
        return {
          ...route,
          params: {
            ...params,
            searchSelectedUserInboxIds: [inboxId],
            isNew: true,
            composerTextPrefill
          }
        }
      }
      return route
    })
    
    return {
      ...state,
      routes: updatedRoutes
    }
  }
  
  return state
} 