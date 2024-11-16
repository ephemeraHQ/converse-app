import mmkv from "./mmkv";
import config from "../config";

export const saveXmtpEnv = () => mmkv.set("xmtp-env", config.xmtpEnv);

export const saveApiURI = () => mmkv.set("api-uri", config.apiURI);
