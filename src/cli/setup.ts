import { readFileSync, writeFileSync } from "node:fs";

import { PkgManager } from "@/cli";
import { exhaustive } from "@/utils";

declare const KOUMU_VERSION: string;

export default function setup(pkgManager: PkgManager) {
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

    const installScript =
        "husky install" +
        "&& cp ./node_modules/koumu/build/commit-msg .husky/commit-msg" +
        "&& chmod +x .husky/commit-msg";

    if (pkgManager === "yarn2") {
        scripts.postinstall = installScript;
        scripts.prepack = "pinst --disable";
        scripts.postpack = "pinst --enable";
    } else {
        scripts.prepare = installScript;
    }

    writeFileSync("./package.json", JSON.stringify(pkg, null, 4));

    console.log(
        "Your package.json has been setup to run Koumu via Husky. Please run the install command " +
            "of your package manager to finish the installation.",
    );
}
