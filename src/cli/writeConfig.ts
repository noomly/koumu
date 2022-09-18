import { existsSync, statSync, writeFileSync } from "node:fs";

import chalk from "chalk";

import { RC_PATH } from "@/config";

export function writeConfig(defaultConfig: string) {
    if (existsSync(RC_PATH) && statSync(RC_PATH).isFile()) {
        console.log(
            chalk.red(
                `A configuration file already exists, please remove it ` +
                    "before running this command.",
            ),
        );
        process.exit(1);
    }

    writeFileSync(RC_PATH, defaultConfig);

    console.log(
        chalk.green(
            `The default configuration file has been written in your repo's root, as ${RC_PATH}! ` +
                "It contains useful documentation to guide you through writing your own Komou " +
                "style.",
        ),
    );
}
