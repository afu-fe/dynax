// https://prettier.io/docs/en/options.html
module.exports = {
  tabWidth: 2, // 缩进
  singleQuote: true,
  trailingComma: 'all', // 始终添加结尾逗号
  printWidth: 120,
  proseWrap: 'never', // 针对 MD 文件，达到最大行宽度（printWidth： 80）时不折行。
  overrides: [
    {
      files: '*.md',
      options: {
        proseWrap: 'preserve', // 为了避免换行符被自动格式化成一行
      },
    },
  ],
};
