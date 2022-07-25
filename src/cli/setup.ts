import { readFileSync, writeFileSync } from "node:fs";

import { PkgManager } from "@/cli";
import { exhaustive } from "@/utils";

declare const KOUMU_VERSION: string;

function setupOther() {
    const pkg = JSON.parse(readFileSync("./package.json").toString());

    if (!pkg.devDependencies) {
        pkg.devDependencies = {};
    }
    if (!pkg.scripts) {
        pkg.scripts = {};
    }

    const { scripts } = pkg;
    const devDeps = pkg.devDependencies;

    devDeps.koumu = KOUMU_VERSION;
    devDeps.husky = "8.0.1";

    scripts.prepare = "husky install";

    writeFileSync("./package.json", JSON.stringify(pkg, null, 4));
}

function setupYarn2() {
    const pkg = JSON.parse(readFileSync("./package.json").toString());

    if (!pkg.devDependencies) {
        pkg.devDependencies = {};
    }
    if (!pkg.scripts) {
        pkg.scripts = {};
    }

    const { scripts } = pkg;
    const devDeps = pkg.devDependencies;

    devDeps.koumu = KOUMU_VERSION;
    devDeps.pinst = "3.0.0";
    devDeps.husky = "8.0.1";

    scripts.postinstall =
        "husky install && cp ./node_modules/koumu/build/commit-msg .husky/commit-msg";
    scripts.prepack = "pinst --disable";
    scripts.postpack = "pinst --enable";

    writeFileSync("./package.json", JSON.stringify(pkg, null, 4));
}

export default function setup(pkgManager: PkgManager) {
    switch (pkgManager) {
        case "yarn2":
            setupYarn2();
            break;
        case "other":
            setupOther();
            break;
        default:
            exhaustive(pkgManager);
    }

    console.log(
        "Your package.json has been setup to run Koumu via Husky. Please run the install command " +
            "of your package manager to finish the installation.",
    );
}
