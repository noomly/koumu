import { chmodSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import chalk from "chalk";

import { exhaustive, findGitDir, findProjectRoot } from "@/utils";

declare const KOUMU_VERSION: string;

export const SETUP_MODES = ["npm", "yarn", "yarn2", "copyIntoHusky", "copyIntoGit"] as const;
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

    const installScript = "husky install && koumu setup --copy-into-husky";

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

function setupCopy(copyToPath: string, commitMsgBuild: string, prepareCommitMsgBuild: string) {
    if (!copyToPath) {
        console.log(
            chalk.red(`Could not find ${copyToPath} in the current directory or any parent.`),
        );
        process.exit(1);
    }

    if (!existsSync(copyToPath) || !statSync(copyToPath).isDirectory()) {
        mkdirSync(copyToPath);
    }

    const commitMsgPath = join(copyToPath, "commit-msg");
    writeFileSync(commitMsgPath, commitMsgBuild);
    chmodSync(commitMsgPath, 0o755);

    const prepareCommitMsgPath = join(copyToPath, "prepare-commit-msg");
    writeFileSync(prepareCommitMsgPath, prepareCommitMsgBuild);
    chmodSync(prepareCommitMsgPath, 0o755);
}

export default function setup(
    mode: SetupMode,
    commitMsgBuild: string,
    prepareCommitMsgBuild: string,
) {
    switch (mode) {
        case "npm":
        case "yarn":
        case "yarn2":
            setupJs(mode);
            break;

        case "copyIntoHusky":
            setupCopy(
                join(findProjectRoot({ exitOnError: true }), ".husky"),
                commitMsgBuild,
                prepareCommitMsgBuild,
            );
            break;

        case "copyIntoGit":
            setupCopy(
                join(findGitDir({ exitOnError: true }), "hooks"),
                commitMsgBuild,
                prepareCommitMsgBuild,
            );
            break;

        default:
            exhaustive(mode);
    }
}
