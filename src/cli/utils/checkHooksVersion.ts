import { createReadStream, existsSync, statSync } from "node:fs";
import { createInterface } from "node:readline";
import { join } from "node:path";

import chalk from "chalk";

import { findProjectRoot } from "@/utils";
import { VERSION } from "@/cli/utils/consts";

function getHookVersion(path: string): Promise<string | undefined> {
    return new Promise((resolve, _) => {
        const rl = createInterface({
            input: createReadStream(path),
            crlfDelay: Infinity,
        });

        let version: string | undefined;
        let lineCount = 0;

        rl.on("line", (line) => {
            const lineLowerCase = line.toLowerCase();
            if (lineLowerCase.includes("koumu") && lineLowerCase.includes("version")) {
                // eslint-disable-next-line prefer-destructuring
                version = line.split(": ")[1];
            }

            if (lineCount >= 1) {
                rl.close();
            }

            lineCount += 1;
        });

        rl.on("close", () => {
            resolve(version);
        });
    });
}

async function shouldRunSetupFor(dir: string, hooks: string[]): Promise<boolean> {
    for (const hook of hooks) {
        const hookPath = join(dir, hook);

        if (!existsSync(hookPath) || !statSync(hookPath).isFile()) {
            return false;
        }

        const version = await getHookVersion(hookPath);

        if (!version) {
            return false;
        }

        if (VERSION !== version) {
            console.log(
                chalk.blue(
                    `At least one hook version doesn't match Koumu's in ${chalk.gray(dir)}` +
                        ` (hook ${chalk.grey(version)} != koumu ${chalk.cyan(VERSION)}).`,
                ),
            );
            return true;
        }
    }

    return false;
}

export async function checkHooksVersion() {
    const projectRoot = findProjectRoot();

    if (!projectRoot) {
        return;
    }

    const huskyDir = join(projectRoot, ".husky");
    const gitDir = join(projectRoot, ".git", "hooks");

    const hooks = ["commit-msg", "prepare-commit-msg"];

    let shouldSetup: "husky" | "git" | undefined;

    if (
        existsSync(huskyDir) &&
        statSync(huskyDir).isDirectory() &&
        (await shouldRunSetupFor(huskyDir, hooks))
    ) {
        shouldSetup = "husky";
    }

    if (
        !shouldSetup &&
        existsSync(gitDir) &&
        statSync(gitDir).isDirectory() &&
        (await shouldRunSetupFor(gitDir, hooks))
    ) {
        shouldSetup = "git";
    }

    if (shouldSetup) {
        console.log(
            chalk.blue(
                "Run " +
                    chalk.cyan(`koumu setup --${shouldSetup}`) +
                    ` to sync the hooks to ${chalk.cyan(VERSION)}.\n`,
            ),
        );
    }
}
