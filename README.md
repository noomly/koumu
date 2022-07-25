# Koumu 呆

Koumu is a simple program that doubles as commit message validator (installed as Git hook) and as a
CLI utility allowing you to interactively write valid commit messages.

---

## How to use

At the moment Koumu is assumed to be used for NPM package projects. There will be a way in the
future to use it on any kind of project.

### Setting up the hook

If you're using Yarn2 for your project, run this command to setup Koumu:

```
npx koumu --setup yarn2
```

Otherwise, run the following:

```
npx koumu --setup other
```

This should edit your `package.json` in order to install Husky and instruct it how to automatically
install the Koumu Git hook inside. To finish the installation, run the `install` command of your
package manager.

### Using the interactive prompt

When you're ready to commit, simply run:

```
npx koumu --commit
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
