import { chmod, writeFile, access, mkdir } from "node:fs/promises";

import esbuild from "esbuild";

import { version } from "../package.json";
import { TextDecoder } from "node:util";

const OUTPUT_DIR = "build";
const OUTPUT_PATH = `${OUTPUT_DIR}/commit-msg`;

async function exists(path: string) {
    try {
        await access(OUTPUT_DIR);
        return true;
    } catch {
        return false;
    }
}

async function cli() {
    const header = `#!/usr/bin/env node\nvar VERSION="${version}";\n`;
    const build = new TextDecoder().decode(
        (
            await esbuild.build({
                platform: "node",
                bundle: true,
                format: "cjs",
                minify: true,
                entryPoints: ["src/cli.ts"],
                write: false,
            })
        ).outputFiles[0].contents,
    );
    await writeFile(`${OUTPUT_DIR}/cli.js`, header + build);
}

async function guki() {
    const header = `#!/usr/bin/env node\n// Guki version: ${version}\n`;
    const build = new TextDecoder().decode(
        (
            await esbuild.build({
                platform: "node",
                bundle: true,
                format: "cjs",
                minify: true,
                entryPoints: ["src/index.ts"],
                write: false,
            })
        ).outputFiles[0].contents,
    );
    await writeFile(OUTPUT_PATH, header + build);
    await chmod(OUTPUT_PATH, 0o755);
}

(async () => {
    if (!(await exists(OUTPUT_DIR))) {
        await mkdir(OUTPUT_DIR);
    }

    await cli();
    await guki();
})();
