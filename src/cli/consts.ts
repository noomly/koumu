import { readFileSync } from "node:fs";

// NOTE: The value of these exported constants are replaced at build time (see `scripts/build.ts`).

export const VERSION = "dev";
export const COMMIT_MSG_BUILD = readFileSync("./build/commit-msg").toString();
export const PREPARE_COMMIT_MSG_BUILD = readFileSync("./build/prepare-commit-msg").toString();
export const DEFAULT_CONFIG = readFileSync("./.koumurc.toml").toString();
