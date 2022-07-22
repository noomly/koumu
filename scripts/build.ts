import { chmod, writeFile, access, mkdir } from "node:fs/promises";

import esbuild from "esbuild";

import pkg from "../package.json" assert { type: "json" };
import { TextDecoder } from "node:util";

const OUTPUT_DIR = "build";
const OUTPUT_PATH = `${OUTPUT_DIR}/commit-msg`;

const header = `#!/usr/bin/env node\n// Berk version: ${pkg.version}\n`;
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

async function dirExists(path: string) {
    try {
        await access(OUTPUT_DIR);
        return true;
    } catch {
        return false;
    }
}

if (!(await dirExists(OUTPUT_DIR))) {
    await mkdir(OUTPUT_DIR);
}

await writeFile(OUTPUT_PATH, header + build);
await chmod(OUTPUT_PATH, 0o755);
