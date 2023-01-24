# Koumu 呆

*Koumu is a simple program that doubles as commit message validator (installed as Git hook) and as
a CLI utility allowing you to interactively write valid commit messages.*

[![npm](https://img.shields.io/npm/v/koumu?style=flat-square)](https://npmjs.com/package/koumu)

---

## How to use

### Installing

First of all you will need `node` in version 17 or more.

Koumu being an NPM package, the recommended way to install it is via NPM. Make sure you have it
installed and run:

```
npm install -g koumu
```

Then if you already configured your `$PATH` to include NPM's global installation directory, you
should be able to just run `koumu --help` in your terminal to get started.

If you didn't configure your `$PATH` and running `koumu --help` results in `command not found`,
you can add the following line at the end of your shell's configuration file (`~/.bashrc`,
`~/.zshrc`, ... depending on your shell):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

### Setting up the hook

Koumu's cli includes a `setup` command to help you configure your repository to use Koumu's Git
hook. It can either simply write the hook file at `.git/hooks/commit-msg` or, if your repository is
a JS project that uses NPM or Yarn, Koumu can also setup [Husky](https://github.com/typicode/husky)
for you; an NPM package that allows committing hooks and automatically installing them when running
`npm/yarn install`.

#### Setup Koumu for any Git repository

If your project isn't a JS project, if your package manager isn't supported, or if you do not wish
to use Husky, you can still easily install the hook on any Git repository by running:

```
koumu setup --generic
```

This will simply write the hook at `.git/hooks/commit-msg`.

#### Setup Koumu and Husky for a JS project

If you're using Yarn 2, run the following command:

```
koumu setup --yarn2
```

If you're using Yarn 1 or NPM, run this one:

```
koumu setup --npm
```

This will edit your `package.json` in order to install Husky and instruct it how to automatically
install the Koumu's hook. To finish the installation, run the `install` command of your package
manager (`yarn install` or `npm install`).

### Using the interactive prompt

When you're ready to commit, simply run:

```
npx koumu commit
```

An interactive prompt will run, assisting you in writing a commit message respecting your rules.

### Defining your rules

Koumu reads a configuration file `koumurc.json` that should be at the root of your project. It is
not generated automatically as of now, so you will need to manually create it. Here is a
configuration sample:

```json
{
    "kinds": {
        ":sparkles:": "implement a new feature",
        ":zap:": "improve existing feature",
        ":bug:": "fix a bug",
        ":bookmark:": "prepare a new release version"
    },
    "scopes": {
        "meta": "anything about the project management",
        "wallet": "concerns the wallet package",
        "snap": "concerns the snap package"
    }
}
```

You can opt out of `scopes` by providing an empty object:

```json
{
    "kinds": {
        ":sparkles:": "implement a new feature",
        ":zap:": "improve existing feature",
        ":bug:": "fix a bug",
        ":bookmark:": "prepare a new release version"
    },
    "scopes": {}
}
```
