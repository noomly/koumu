import { chmodSync, copyFileSync, writeFileSync } from "node:fs";

import { Command } from "commander";

import commit from "@/cli/commit";
import setup, { SetupMode, SETUP_MODES } from "@/cli/setup";

declare const KOUMU_VERSION: string;
declare const KOUMU_HOOK_BUILD: string;

const program = new Command().name("koumu").version(KOUMU_VERSION);

program
    .command("setup")
    .option("--npm", "setup Koumu for NPM or Yarn v1")
    .option("--yarn", "alias for --npm")
    .option("--yarn2", "setup Koumu for Yarn v2+")
    .option(
        "--generic",
        "only install Koumu's git hook into standard git directory (use this if" +
            " your repo doesn't host a JS project)",
    )
    .action((rawOptions: Record<SetupMode, boolean>, cmd) => {
        const options = Object.keys(rawOptions) as SetupMode[];
        if (options.length !== 1 || !SETUP_MODES.includes(options[0])) {
            cmd.help();
        }

        setup(options[0], KOUMU_HOOK_BUILD);
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
