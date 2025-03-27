// Route that handles initial authentication
export const AUTHENTICATE_ROUTE = "/api/v1/authenticate"

// Routes that don't require any authentication headers
export const NON_AUTHENTICATED_ROUTES = ["/api/v1/app-config"] as const
