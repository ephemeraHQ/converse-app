const BOUNDARY_START = /(\s|\(|^)/.source; // Either a space, the beginning of the text, or a (
const BOUNDARY_END = /(\s|\)|$)/.source; // Either a space, the end of the text, or a )
const WORD_CONTENT = /[^()/\s]/.source; // Not a space, not a ( or ), not a /
const URL_WORD_CONTENT = /[^()\s]/.source; // Not a space, not a ( or )

const getDomainExpression = (suffix: RegExp) =>
  new RegExp(
    `(?<=${BOUNDARY_START})${WORD_CONTENT}*${suffix.source}(?=${BOUNDARY_END})`,
    "gi"
  );

export const URL_REGEX = new RegExp(
  `(?<=${BOUNDARY_START})((http(s?)://)|(www.))${URL_WORD_CONTENT}*\\.${URL_WORD_CONTENT}*(?=${BOUNDARY_END})`,
  "gi"
);

export const ADDRESS_REGEX = new RegExp(
  `(?<=${BOUNDARY_START})0x[a-fA-F0-9]{40}(?=${BOUNDARY_END})`,
  "gi"
);

export const LENS_REGEX = getDomainExpression(/\.lens/);
export const ETH_REGEX = getDomainExpression(/\.eth/);
export const FARCASTER_REGEX = getDomainExpression(/\.fc/);
export const CB_ID_REGEX = getDomainExpression(/\.cb\.id/);
export const UNS_REGEX = getDomainExpression(
  /\.(crypto|bitcoin|blockchain|dao|nft|888|wallet|x|klever|zil|hi|kresus|polygon|anime|manga|binanceus)/
);

export const EMAIL_REGEX =
  /([-!#-'*+/-9=?A-Z^-~]+(\.[-!#-'*+/-9=?A-Z^-~]+)*|"([]!#-[^-~ \t]|(\\[\t -~]))+")@([0-9A-Za-z]([0-9A-Za-z-]{0,61}[0-9A-Za-z])?(\.[0-9A-Za-z]([0-9A-Za-z-]{0,61}[0-9A-Za-z])?)*|\[((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|IPv6:((((0|[1-9A-Fa-f][0-9A-Fa-f]{0,3}):){6}|::((0|[1-9A-Fa-f][0-9A-Fa-f]{0,3}):){5}|[0-9A-Fa-f]{0,4}::((0|[1-9A-Fa-f][0-9A-Fa-f]{0,3}):){4}|(((0|[1-9A-Fa-f][0-9A-Fa-f]{0,3}):)?(0|[1-9A-Fa-f][0-9A-Fa-f]{0,3}))?::((0|[1-9A-Fa-f][0-9A-Fa-f]{0,3}):){3}|(((0|[1-9A-Fa-f][0-9A-Fa-f]{0,3}):){0,2}(0|[1-9A-Fa-f][0-9A-Fa-f]{0,3}))?::((0|[1-9A-Fa-f][0-9A-Fa-f]{0,3}):){2}|(((0|[1-9A-Fa-f][0-9A-Fa-f]{0,3}):){0,3}(0|[1-9A-Fa-f][0-9A-Fa-f]{0,3}))?::(0|[1-9A-Fa-f][0-9A-Fa-f]{0,3}):|(((0|[1-9A-Fa-f][0-9A-Fa-f]{0,3}):){0,4}(0|[1-9A-Fa-f][0-9A-Fa-f]{0,3}))?::)((0|[1-9A-Fa-f][0-9A-Fa-f]{0,3}):(0|[1-9A-Fa-f][0-9A-Fa-f]{0,3})|(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3})|(((0|[1-9A-Fa-f][0-9A-Fa-f]{0,3}):){0,5}(0|[1-9A-Fa-f][0-9A-Fa-f]{0,3}))?::(0|[1-9A-Fa-f][0-9A-Fa-f]{0,3})|(((0|[1-9A-Fa-f][0-9A-Fa-f]{0,3}):){0,6}(0|[1-9A-Fa-f][0-9A-Fa-f]{0,3}))?::)|(?!IPv6:)[0-9A-Za-z-]*[0-9A-Za-z]:[!-Z^-~]+)])/gi;
