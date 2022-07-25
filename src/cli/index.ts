import { Command } from "commander";

import commit from "@/cli/interactiveCommit";
import setup from "@/cli/setup";

declare const KOUMU_VERSION: string;

const PKG_MANAGER = ["yarn2", "other"] as const;
export type PkgManager = typeof PKG_MANAGER[number];

type Options = {
    setup: PkgManager;
    commit: boolean;
};

const cmd = new Command()
    .name("koumu")
    .version(KOUMU_VERSION)
    .option("--setup <yarn1|yarn2>")
    .option("--commit");

const opts = cmd.parse().opts<Options>();

if (opts.setup && PKG_MANAGER.includes(opts.setup)) {
    setup(opts.setup);
} else if (opts.commit) {
    commit();
} else {
    cmd.help();
}

cmd.parse();
