import axios from "axios";
import { config } from "../../config";
import { headersInterceptor } from "../../features/authentication/interceptor.headers";

export const api = axios.create({
  baseURL: config.apiURI,
});

// Setup request interceptor for attaching appropriate headers
// depending on the route in the request
api.interceptors.request.use(headersInterceptor);

// note(lustig) - We setup another interceptor in useLogoutOnJwtRefreshError
// to handle 401 errors and logout the user.
// This needs to be a hook because some of our logout apis are most
// conveniently accessedl via hooks.
// The hook is setup in App.tsx
