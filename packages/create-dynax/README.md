# create-dynax <a href="https://npmjs.com/package/create-dynax"><img src="https://img.shields.io/npm/v/create-dynax" alt="npm package"></a>

## Scaffolding Your First Dynax Project

> **Compatibility Note:**
> Dynax requires Node.js version 16+, However, some templates require a higher Node.js version to work, please upgrade if your package manager warns about it..

With NPM:

```bash
  $ npm create dynax@latest
```

With PNPM:

```bash
  $ pnpm create dynax
```

Then follow the prompts!

You can also directly specify the project name and the template you want to use via additional command line options. For example, to scaffold a Vite + Vue project, run:

```bash
# npm 7+, extra double-dash is needed:
npm create dynax@latest my-vue-app --template vue

# pnpm
pnpm create dynax my-vue-app --template vue

```

Currently supported template presets include:

- `vue`
- `vue-ts`
- `react`
- `react-ts`
- `react-swc`
- `react-swc-ts`
- `react-native-ts`

You can use `.` for the project name to scaffold in the current directory.
