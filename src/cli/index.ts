import { Command } from "commander";

import commit from "@/cli/interactiveCommit";
import setup from "@/cli/setup";

declare const KOUMU_VERSION: string;

const PKG_MANAGER = ["yarn2", "other"] as const;
export type PkgManager = typeof PKG_MANAGER[number];

const program = new Command().name("koumu").version(KOUMU_VERSION);

program
    .command("setup")
    .option("--yarn2")
    .option("--other")
    .action((rawOptions: Record<string, boolean>, cmd) => {
        const options = Object.keys(rawOptions);
        if (options.length !== 1 || !PKG_MANAGER.includes(options[0] as PkgManager)) {
            cmd.help();
        }

        setup(options[0] as PkgManager);
    });

program
    .command("commit")
    .option("-e")
    .action((rawOptions: Record<string, boolean>, _cmd) => {
        const options = Object.keys(rawOptions);
        commit(!!options[0]);
    });

program.parse();
