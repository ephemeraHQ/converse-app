import { useEffect, useRef } from "react";
import { api } from "../../utils/api/api";
import { refreshJwtInterceptor } from "./interceptor.refresh-jwt";
import { useLogout } from "@/features/authentication/use-logout.hook";
import logger from "@/utils/logger";

export const useLogoutOnJwtRefreshError = () => {
  const { logout } = useLogout();
  // const hasSetup = useRef(false);
  useEffect(() => {
    // if (hasSetup.current) return;
    // hasSetup.current = true;
    logger.debug(
      "[useLogoutOnJwtRefreshError] Setting up JWT refresh interceptor"
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      refreshJwtInterceptor(api, () => {
        logger.error(
          "[useLogoutOnJwtRefreshError] JWT refresh failed, [wouldc log out but not right now]logging out"
        );
        logout();
      })
    );

    return () => {
      logger.debug(
        "[useLogoutOnJwtRefreshError] Cleaning up JWT refresh interceptor"
      );
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [logout]);

  return api;
};
