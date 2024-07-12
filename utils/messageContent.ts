import emojiRegex from "emoji-regex";

export const getUrlToRender = (url: string) => {
  const fullUrl = new URL(url);
  return fullUrl.hostname;
};

export const isAllEmojisAndMaxThree = (str: string) => {
  const strWithoutSpaces = str.replaceAll(" ", "");

  const emojiMatches = strWithoutSpaces.match(emojiRegex()) || [];
  const emojiCount = emojiMatches.length;

  return (
    emojiCount > 0 &&
    emojiCount <= 3 &&
    emojiMatches.join("") === strWithoutSpaces
  );
};
