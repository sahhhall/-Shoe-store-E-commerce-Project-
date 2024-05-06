const randomGen = (prefixToAdd) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = prefixToAdd;
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * 10));
  }
  return result;
};

module.exports = {
  randomGen,
};
