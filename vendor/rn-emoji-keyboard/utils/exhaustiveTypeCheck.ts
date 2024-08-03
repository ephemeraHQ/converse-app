export const exhaustiveTypeCheck = (arg: never, strict = true) => {
  if (strict) {
    throw new Error(`unhandled union case for : ${arg}`);
  }
};
