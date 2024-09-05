import logger from "./logger";

class Share {
  open(_payload: { title: string; url: string; type: string }) {
    logger.warn("TODO: implement Share.open for web");
  }
}

export default new Share();
