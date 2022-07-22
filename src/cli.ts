import { readFileSync, writeFileSync } from "node:fs";
import { Command } from "commander";

declare const VERSION: string;

type Options = {
    init: boolean;
};

const opts = new Command().name("guki").version(VERSION).option("--init").parse().opts<Options>();

if (!opts.init) {
    console.log("Run Guki with --init to initialize a new project.");
    process.exit(0);
}

const pkg = JSON.parse(readFileSync("./package.json").toString());

if (!pkg.devDependencies) {
    pkg.devDependencies = {};
}
if (!pkg.scripts) {
    pkg.scripts = {};
}

const { scripts } = pkg;
const devDeps = pkg.devDependencies;

devDeps.guki = VERSION;
devDeps.pinst = "3.0.0";
devDeps.husky = "8.0.1";

scripts.postinstall = "husky install && cp ./node_modules/guki/build/commit-msg .husky/commit-msg";
scripts.prepack = "pinst --disable";
scripts.postpack = "pinst --enable";

writeFileSync("./package.json", JSON.stringify(pkg, null, 4));
