import { existsSync, statSync, writeFileSync } from "node:fs";

import chalk from "chalk";

export function writeConfig(defaultConfig: string, path: string) {
    if (existsSync(path) && statSync(path).isFile()) {
        console.log(
            chalk.red(
                `A configuration file already exists at "${path}", please make a backup and ` +
                    "remove it before running this command.",
            ),
        );
        process.exit(1);
    }

    writeFileSync(path, defaultConfig);

    console.log(
        chalk.green(
            `The default configuration file has been written, at "${path}"! ` +
                "It contains useful documentation to guide you through writing your own Komou " +
                "style.",
        ),
    );
}
