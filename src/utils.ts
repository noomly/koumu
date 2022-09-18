import { spawn } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

export function exhaustive(_: never): never {
    throw new Error("Exhaustive switch");
}

export function findGitDir(path: string): string | null {
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
        return findGitDir(resolve(path, ".."));
    }
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
