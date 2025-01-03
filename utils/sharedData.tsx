import mmkv from "./mmkv";
import config from "../config";

export const saveXmtpEnv = () => mmkv.set("xmtp-env", config.xmtpEnv);

/**
 *
 * @returns Sets the api-uri in mmkv to be accessed by the native iOS app
 */
export const saveApiURI = () => mmkv.set("api-uri", config.apiURI);
