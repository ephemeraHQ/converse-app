export const getUrlToRender = (url: string) => {
  const fullUrl = new URL(url);
  return fullUrl.hostname;
};

const isEmoji = (character: string) => {
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
  return emojiRegex.test(character);
};

export const isAllEmojisAndMaxThree = (str: string) => {
  const strWithoutSpaces = str.replaceAll(" ", "");
  const iterator = [...strWithoutSpaces];
  let emojiCount = 0;

  for (const char of iterator) {
    if (isEmoji(char)) {
      emojiCount++;
    } else {
      // break if any aren't emojis
      return false;
    }
  }
  return emojiCount > 0 && emojiCount <= 3;
};
