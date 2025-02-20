import { useEffect } from "react";
import { api } from "../../utils/api/api";
import { refreshJwtInterceptor } from "./interceptor.refresh-jwt";
import { useLogout } from "@/features/authentication/use-logout.hook";
import logger from "@/utils/logger";

export const useLogoutOnJwtRefreshError = () => {
  const { logout } = useLogout();

  useEffect(() => {
    // Store interceptors so we can remove them later
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      refreshJwtInterceptor(api, () => {
        logger.debug("[useLogoutOnJwtRefreshError] Logging out");
        // Now we can use hook-based functions here
        logout();
      })
    );

    // Cleanup function to remove interceptors when the component unmounts
    // or when logout changes
    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [logout]); // Only reconfigure if logout changes

  return api;
};
