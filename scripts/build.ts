import { chmod, writeFile, access, mkdir } from "node:fs/promises";
import { TextDecoder } from "node:util";
import { join } from "node:path";

import esbuild from "esbuild";

import { version } from "package.json";

const OUTPUT_DIR = "build";

async function exists(path: string) {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
}

async function cli(commitMsgBuild: string, prepareCommitMsgBuild: string): Promise<string> {
    const header =
        `#!/usr/bin/env node\n` +
        `var KOUMU_VERSION="${version}";\n` +
        `var KOUMU_COMMIT_MSG_BUILD=${JSON.stringify(commitMsgBuild)};\n` +
        `var KOUMU_PREPARE_COMMIT_MSG_BUILD=${JSON.stringify(prepareCommitMsgBuild)};\n`;
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

async function commitMsg(): Promise<string> {
    const header = `#!/usr/bin/env node\n// Koumu version: ${version}\n`;
    const build = new TextDecoder().decode(
        (
            await esbuild.build({
                platform: "node",
                bundle: true,
                format: "cjs",
                minify: true,
                entryPoints: ["src/hooks/commitMsg.ts"],
                write: false,
            })
        ).outputFiles[0].contents,
    );
    const final = header + build;

    const outputPath = join(OUTPUT_DIR, "commit-msg");
    await writeFile(outputPath, final);
    await chmod(outputPath, 0o755);

    return final;
}

async function prepareCommitMsg(): Promise<string> {
    const header = `#!/usr/bin/env node\n// Koumu version: ${version}\n`;
    const build = new TextDecoder().decode(
        (
            await esbuild.build({
                platform: "node",
                bundle: true,
                format: "cjs",
                minify: true,
                entryPoints: ["src/hooks/prepareCommitMsg.ts"],
                write: false,
            })
        ).outputFiles[0].contents,
    );
    const final = header + build;

    const outputPath = join(OUTPUT_DIR, "prepare-commit-msg");
    await writeFile(outputPath, final);
    await chmod(outputPath, 0o755);

    return final;
}

(async () => {
    if (!(await exists(OUTPUT_DIR))) {
        await mkdir(OUTPUT_DIR);
    }

    const commitMsgBuild = await commitMsg();
    const prepareCommitMsgBuild = await prepareCommitMsg();
    await cli(commitMsgBuild, prepareCommitMsgBuild);
})();
