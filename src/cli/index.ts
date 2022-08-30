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
    .option("-e --external", "use an external editor to edit the commit message")
    .option(
        "-i --issue",
        "(requires github cli) interactively select an issue that will be added to the footer",
    )
    .option(
        "-c --closes-issue",
        "(requires github cli) interactively select an issue that will be added to the footer," +
            ' prepended with "closes"',
    )
    .action((options: Record<"external" | "issue" | "closesIssue", boolean>, _cmd) => {
        commit(options.external, options.issue, options.closesIssue);
    });

program.parse();
