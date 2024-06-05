const wordlist = [
  "ack",
  "alabama",
  "alanine",
  "alaska",
  "alpha",
  "angel",
  "apart",
  "april",
  "arizona",
  "arkansas",
  "artist",
  "asparagus",
  "aspen",
  "august",
  "autumn",
  "avocado",
  "bacon",
  "bakerloo",
  "batman",
  "beer",
  "berlin",
  "beryllium",
  "black",
  "blossom",
  "blue",
  "bluebird",
  "bravo",
  "bulldog",
  "burger",
  "butter",
  "california",
  "carbon",
  "cardinal",
  "carolina",
  "carpet",
  "cat",
  "ceiling",
  "charlie",
  "chicken",
  "coffee",
  "cola",
  "cold",
  "colorado",
  "comet",
  "connecticut",
  "crazy",
  "cup",
  "dakota",
  "december",
  "delaware",
  "delta",
  "diet",
  "don",
  "double",
  "early",
  "earth",
  "east",
  "echo",
  "edward",
  "eight",
  "eighteen",
  "eleven",
  "emma",
  "enemy",
  "equal",
  "failed",
  "fanta",
  "fifteen",
  "fillet",
  "finch",
  "fish",
  "five",
  "fix",
  "floor",
  "florida",
  "football",
  "four",
  "fourteen",
  "foxtrot",
  "freddie",
  "friend",
  "fruit",
  "gee",
  "georgia",
  "glucose",
  "golf",
  "green",
  "grey",
  "hamper",
  "happy",
  "harry",
  "hawaii",
  "helium",
  "high",
  "hot",
  "hotel",
  "hydrogen",
  "idaho",
  "illinois",
  "india",
  "indigo",
  "ink",
  "iowa",
  "island",
  "item",
  "jersey",
  "jig",
  "johnny",
  "juliet",
  "july",
  "jupiter",
  "kansas",
  "kentucky",
  "kilo",
  "king",
  "kitten",
  "lactose",
  "lake",
  "lamp",
  "lemon",
  "leopard",
  "lima",
  "lion",
  "lithium",
  "london",
  "louisiana",
  "low",
  "magazine",
  "magnesium",
  "maine",
  "mango",
  "march",
  "mars",
  "maryland",
  "massachusetts",
  "may",
  "mexico",
  "michigan",
  "mike",
  "minnesota",
  "mirror",
  "mississippi",
  "missouri",
  "mobile",
  "mockingbird",
  "monkey",
  "montana",
  "moon",
  "mountain",
  "muppet",
  "music",
  "nebraska",
  "neptune",
  "network",
  "nevada",
  "nine",
  "nineteen",
  "nitrogen",
  "north",
  "november",
  "nuts",
  "october",
  "ohio",
  "oklahoma",
  "one",
  "orange",
  "oranges",
  "oregon",
  "oscar",
  "oven",
  "oxygen",
  "papa",
  "paris",
  "pasta",
  "pennsylvania",
  "pip",
  "pizza",
  "pluto",
  "potato",
  "princess",
  "purple",
  "quebec",
  "queen",
  "quiet",
  "red",
  "river",
  "robert",
  "robin",
  "romeo",
  "rugby",
  "sad",
  "salami",
  "saturn",
  "september",
  "seven",
  "seventeen",
  "shade",
  "sierra",
  "single",
  "sink",
  "six",
  "sixteen",
  "skylark",
  "snake",
  "social",
  "sodium",
  "solar",
  "south",
  "spaghetti",
  "speaker",
  "spring",
  "stairway",
  "steak",
  "stream",
  "summer",
  "sweet",
  "table",
  "tango",
  "ten",
  "tennessee",
  "tennis",
  "texas",
  "thirteen",
  "three",
  "timing",
  "triple",
  "twelve",
  "twenty",
  "two",
  "uncle",
  "undress",
  "uniform",
  "uranus",
  "utah",
  "vegan",
  "venus",
  "vermont",
  "victor",
  "video",
  "violet",
  "virginia",
  "washington",
  "west",
  "whiskey",
  "white",
  "william",
  "winner",
  "winter",
  "wisconsin",
  "wolfram",
  "wyoming",
  "xray",
  "yankee",
  "yellow",
  "zebra",
  "zulu",
];

export const humanize = function (digest, numWords, separator) {
  var chars,
    i,
    len,
    hex,
    output = [],
    bytes = [],
    compressedBytes = [];

  // defaults
  numWords = numWords || 4;
  separator = separator || "-";

  if (!/^[a-fA-F0-9]+$/.test(digest)) {
    throw new Error("`digest` must be hexadecimal characters only.");
  }

  chars = digest.split("");

  // loop through characters, grabbing two at a time and turning them into
  // a single hex value
  for (i = 0, len = chars.length; i < len && output.length < numWords; i += 2) {
    hex = parseInt(chars[i] + (chars[i + 1] || "0"), 16);
    bytes.push(hex);
  }

  compressedBytes = compress(bytes, numWords);

  for (var i = 0; i < numWords; i += 1) {
    output.push(wordlist[compressedBytes[i]]);
  }

  return output.join(separator);
};

export const compress = function (bytes, target) {
  // Compress a list of byte values to a fixed target length.

  // A smaller number of bytes will be zero-padded to a larger number as needed
  for (var i = target - bytes.length; i > 0; i -= 1) {
    bytes.push(0);
  }

  if (target === bytes.length) {
    return bytes;
  }

  var bytesLength = bytes.length,
    seg_size = Math.floor(bytesLength / target),
    segments = [],
    seg_num = 0;

  // Split `bytes` into `target` segments.
  // XOR is used for compression.
  // Left-over bytes are caught in the last segment.
  for (var i = 0, ii = bytesLength; i < ii; i += 1) {
    seg_num = Math.min(Math.floor(i / seg_size), target - 1);
    segments[seg_num] =
      segments[seg_num] !== undefined ? segments[seg_num] ^ bytes[i] : bytes[i];
  }

  return segments;
};

export const uuid = function (numWords, separator) {
  digest = "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
  return [humanize(digest, numWords, separator), digest];
};

export const dehumanize = function (human, separator) {
  // Reverse a human hash to a digest string.
  // HumanHasher.dehumanize('beer-earth-princess-five')
  // '1337b347'

  var separator = separator || "-",
    human = human.split(separator),
    result = [],
    found = "";

  for (var i = 0, ii = human.length; i < ii; i += 1) {
    found = unhash(human[i]);
    if (found === false) {
      return false;
    }
    result.push(found.toString(16));
  }

  return result.join("");
};

export const unhash = function (human) {
  // Binary search for the index of the human hash word
  // HumanHasher.unhash('wisconsin')
  // 248

  var human = human.toLowerCase(),
    upper = 255,
    lower = 0,
    middle = 0,
    foundHash = "";

  while (upper >= lower) {
    var middle = lower + Math.floor((upper - lower) / 2),
      foundHash = wordlist[middle].toLowerCase();
    if (foundHash < human) {
      lower = middle + 1;
    } else if (foundHash > human) {
      upper = middle - 1;
    } else {
      // word found, return index
      return middle;
    }
  }

  // word not found in the wordlist
  return false;
};
