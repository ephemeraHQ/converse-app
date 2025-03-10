const BOUNDARY_START_LOOKBEHIND = /(\s|\(|"|'|,)/.source // Either a space or a (, or a " or a '
const BOUNDARY_START = new RegExp(`(?<=${BOUNDARY_START_LOOKBEHIND})|^`).source // It must be start of the line or be preceded by lookbehind
const BOUNDARY_END_LOOKAHEAD = /(\s|\)|$|\.|!|\?|\r\n|\r|\n|"|'|,)/.source // Either a space, the end of the text, or a ), a ., a !, a ?, a line break, or a " or a '
const BOUNDARY_END = new RegExp(`(?=${BOUNDARY_END_LOOKAHEAD})`).source
const WORD_CONTENT = /[^()/\s]/.source // Not a space, not a ( or ), not a /

const getDomainExpression = (suffix: RegExp) =>
  new RegExp(`${BOUNDARY_START}${WORD_CONTENT}*${suffix.source}${BOUNDARY_END}`, "gi")

export const URL_REGEX =
  /\b(?:(?:https?|ftp):\/\/|www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/\S*)?(?:\?\S*)?\b/gi

export const ADDRESS_REGEX = new RegExp(`${BOUNDARY_START}0x[a-fA-F0-9]{40}${BOUNDARY_END}`, "gi")

export const LENS_REGEX = getDomainExpression(/\.lens/)
export const ENS_REGEX = getDomainExpression(/\.eth/)
export const FARCASTER_REGEX = getDomainExpression(/\.fc/)
export const CB_ID_REGEX = getDomainExpression(/\.cb\.id/)
export const UNS_REGEX = getDomainExpression(
  /\.(crypto|bitcoin|blockchain|dao|nft|888|wallet|x|klever|zil|hi|kresus|polygon|anime|manga|binanceus)/,
)

export const EMAIL_REGEX =
  /(?:[a-z0-9!#$%&'*+=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/gi

export const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89ABab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
