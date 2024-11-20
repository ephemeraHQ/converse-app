import config from "../../../config";

export const AUTHORIZED_URL_PROTOCOLS = new Set([
  `${config.scheme}:`,
  ...config.framesAllowedSchemes.map((s) => `${s}:`),
]);
