import { chmodSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import chalk from "chalk";

import { exhaustive } from "@/utils";

declare const KOUMU_VERSION: string;

export const SETUP_MODES = ["npm", "yarn", "yarn2", "generic"] as const;
export type SetupMode = typeof SETUP_MODES[number];

function setupJs(mode: SetupMode) {
    const pkg = JSON.parse(readFileSync("./package.json").toString());

    if (!pkg.devDependencies) {
        pkg.devDependencies = {};
    }
    if (!pkg.scripts) {
        pkg.scripts = {};
    }

    const { scripts } = pkg;
    const devDeps = pkg.devDependencies;

    devDeps.koumu = KOUMU_VERSION;
    devDeps.husky = "8.0.1";

    const installScript =
        "husky install" +
        "&& cp ./node_modules/koumu/build/commit-msg .husky/commit-msg" +
        "&& chmod +x .husky/commit-msg";

    if (mode === "yarn2") {
        scripts.postinstall = installScript;
        scripts.prepack = "pinst --disable";
        scripts.postpack = "pinst --enable";
    } else {
        scripts.prepare = installScript;
    }

    writeFileSync("./package.json", JSON.stringify(pkg, null, 4));

    console.log(
        "Your package.json has been setup to run Koumu via Husky. Please run the install command " +
            "of your package manager to finish the installation.",
    );
}

function findGit(path: string): string | null {
    const gitPath = join(path, ".git");

    try {
        if (existsSync(gitPath) && statSync(gitPath).isDirectory()) {
            return gitPath;
        }
    } catch (e) {
        return null;
    }

    if (path === "/") {
        return null;
    } else {
        return findGit(resolve(path, ".."));
    }
}

function setupGeneric(hookBuild: string) {
    const gitPath = findGit(process.cwd());

    if (!gitPath) {
        console.log(
            chalk.red(`Could not find a .git directory in the current directory or any parent.`),
        );
        process.exit(1);
    }

    const hooksPath = join(gitPath, "hooks");

    if (!existsSync(hooksPath) || !statSync(hooksPath).isDirectory()) {
        mkdirSync(hooksPath);
    }

    const hookPath = join(hooksPath, "commit-msg");

    writeFileSync(hookPath, hookBuild);
    chmodSync(hookPath, 0o755);
}

export default function setup(mode: SetupMode, hookBuild: string) {
    switch (mode) {
        case "npm":
        case "yarn":
        case "yarn2":
            setupJs(mode);
            break;

        case "generic":
            setupGeneric(hookBuild);
            break;

        default:
            exhaustive(mode);
    }
}
