import chalk from "chalk";
import { spawn } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

export function exhaustive(_: never): never {
    throw new Error("Exhaustive switch");
}

// eslint-disable-next-line consistent-return
export function findRoot(path?: string): string {
    const effectivePath = path ?? process.cwd();

    const gitPath = join(effectivePath, ".git");

    let error = false;

    try {
        if (existsSync(gitPath) && statSync(gitPath).isDirectory()) {
            return effectivePath;
        }
    } catch (e) {
        error = true;
    }

    if (error || path === "/") {
        console.log(chalk.red("Could not find the root of the repository."));
        process.exit(1);
    } else {
        return findRoot(resolve(effectivePath, ".."));
    }
}

export function findGitDir(path?: string): string {
    return findRoot(path);
}

export function isMerge(): boolean {
    const gitDir = findGitDir(process.cwd());

    if (!gitDir) {
        return false;
    }

    return existsSync(join(gitDir, "MERGE_HEAD"));
}

export function execCmd(cmd: string, args: string[], timeout = 5000): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
        const cmdProcess = spawn(cmd, args, { timeout });

        cmdProcess.on("error", () => reject("error"));

        cmdProcess.stdout.on("data", (data) => resolve(data.toString()));

        cmdProcess.on("close", () => resolve(undefined));
    });
}
