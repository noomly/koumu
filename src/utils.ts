import chalk from "chalk";
import { spawn } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

type FindPathArgs<T extends boolean> = {
    fromPath?: string;
    exitOnError?: T;
};

type FindPathResult<T extends boolean> = T extends true ? string : string | undefined;

// eslint-disable-next-line consistent-return
export function findProjectRoot<T extends boolean>({
    fromPath,
    exitOnError,
}: FindPathArgs<T> = {}): FindPathResult<T> {
    const effectivePath = fromPath ?? process.cwd();

    const gitPath = join(effectivePath, ".git");

    let error = false;

    try {
        if (existsSync(gitPath) && statSync(gitPath).isDirectory()) {
            return effectivePath;
        }
    } catch (e) {
        error = true;
    }

    if (error || fromPath === "/") {
        if (exitOnError) {
            console.log(chalk.red("Could not find the root of the repository."));
            process.exit(1);
        } else {
            return undefined as FindPathResult<T>;
        }
    } else {
        return findProjectRoot({ fromPath: resolve(effectivePath, ".."), exitOnError });
    }
}

export function findGitDir<T extends boolean>(args: FindPathArgs<T> = {}): FindPathResult<T> {
    const root = findProjectRoot(args);

    if (root) {
        return join(root, ".git");
    } else {
        return undefined as FindPathResult<T>;
    }
}

export function isMerge(): boolean {
    const gitDir = findGitDir({ fromPath: process.cwd(), exitOnError: true });

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

export function exhaustive(_: never): never {
    throw new Error("Exhaustive switch");
}
