import { chmod, writeFile, access, mkdir } from "node:fs/promises";
import { TextDecoder } from "node:util";

import esbuild from "esbuild";

import { version } from "package.json";

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

async function cli(hookBuild: string): Promise<string> {
    const header =
        `#!/usr/bin/env node\n` +
        `var KOUMU_VERSION="${version}";\n` +
        `var KOUMU_HOOK_BUILD=${JSON.stringify(hookBuild)};\n`;
    const build = new TextDecoder().decode(
        (
            await esbuild.build({
                platform: "node",
                bundle: true,
                format: "cjs",
                minify: true,
                entryPoints: ["src/cli/index.ts"],
                write: false,
            })
        ).outputFiles[0].contents,
    );
    const final = header + build;
    await writeFile(`${OUTPUT_DIR}/cli.js`, final);

    return final;
}

async function koumu(): Promise<string> {
    const header = `#!/usr/bin/env node\n// Koumu version: ${version}\n`;
    const build = new TextDecoder().decode(
        (
            await esbuild.build({
                platform: "node",
                bundle: true,
                format: "cjs",
                minify: true,
                entryPoints: ["src/gitHook.ts"],
                write: false,
            })
        ).outputFiles[0].contents,
    );
    const final = header + build;
    await writeFile(OUTPUT_PATH, final);
    await chmod(OUTPUT_PATH, 0o755);

    return final;
}

(async () => {
    if (!(await exists(OUTPUT_DIR))) {
        await mkdir(OUTPUT_DIR);
    }

    const hookBuild = await koumu();
    await cli(hookBuild);
})();
