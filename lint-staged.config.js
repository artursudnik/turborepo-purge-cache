module.exports = {
  '*.{md,json,yaml,yml}': [`prettier -w`],
  '*.{js,ts}': [`prettier -w`, 'eslint_d --fix'],
};
