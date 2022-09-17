import { readFileSync, writeFileSync } from "node:fs";

import { isMerge } from "@/utils";
import { readConfig } from "@/config";

const { mergeKind } = readConfig();

const MSG_PATH = process.argv[2];
const COMMIT_TYPE = process.argv[3];

if (!isMerge()) {
    process.exit(0);
}

const commitMsg = readFileSync(MSG_PATH).toString();

if (!commitMsg.startsWith(mergeKind + " ")) {
    const newCommitMsg = `${mergeKind} ${commitMsg}`;
    writeFileSync(MSG_PATH, newCommitMsg);
}
