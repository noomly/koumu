import { spawnSync } from "node:child_process";

import chalk from "chalk";

import { readConfig } from "@/config";
import { promptLine, promptSelect } from "@/cli/commit/prompts";
import { ghIssuesPrompt, loadGhIssues } from "@/cli/commit/ghIssues";
import { execCmd, isMerge } from "@/utils";

async function regularCommit(
    externalEditor: boolean,
    withIssue: boolean,
    withClosingIssue: boolean,
) {
    let ghIssues;
    if (withIssue || withClosingIssue) {
        ghIssues = loadGhIssues();
    }

    const { kinds, scopes, maxMessageLength } = readConfig();

    const kind = await promptSelect("commit kind", kinds);

    const scope = scopes.length === 0 ? undefined : await promptSelect("commit scope", scopes);

    const issue = !ghIssues ? undefined : await ghIssuesPrompt(ghIssues, withClosingIssue);
    if (issue === "error") {
        console.log(
            "Couldn't load issues from Github. Verify that you have Github's cli installed" +
                ` and are logged in (by running \`${chalk.bold("gh auth login")}\`).` +
                ` ${chalk.blue(chalk.underline("https://github.com/cli/cli#installation"))}`,
        );
        process.exit(0);
    }

    const message = externalEditor
        ? undefined
        : await promptLine("commit message", maxMessageLength, maxMessageLength - 10);

    const commitMessage =
        kind +
        (scope ? ` ${scope}:` : "") +
        (message ? ` ${message}` : " ") +
        (issue ? `\n\n(${issue})` : "");

    const gitArgs = ["commit", "-m", commitMessage];

    if (externalEditor) {
        gitArgs.push("-e");
    }

    spawnSync("git", gitArgs, { stdio: "inherit" });
}

async function mergeCommit(externalEditor: boolean) {
    const { mergeKind, maxMessageLength } = readConfig();

    const message = externalEditor
        ? undefined
        : await promptLine("merge commit message", maxMessageLength, maxMessageLength - 10);

    const commitMessage = mergeKind + (message ? ` ${message}` : " ");

    const gitArgs = ["commit", "-m", commitMessage];

    if (externalEditor) {
        gitArgs.push("-e");
    }

    spawnSync("git", gitArgs, { stdio: "inherit" });
}

async function getStagedFiles(): Promise<string[]> {
    let stagedFiles: string[] | undefined;

    try {
        stagedFiles = (await execCmd("git", ["diff", "--name-only", "--cached"]))
            ?.trim()
            .split("\n");
    } catch {
        return [];
    }

    return stagedFiles || [];
}

async function getUnmergedFiles(): Promise<string[]> {
    let unmergedFiles: string[] | undefined;

    try {
        unmergedFiles = (
            await execCmd("git", ["diff", "--name-only", "--diff-filter=U", "--relative"])
        )
            ?.trim()
            .split("\n");
    } catch {
        return [];
    }

    return unmergedFiles || [];
}

export default async function commit(
    externalEditor: boolean,
    withIssue: boolean,
    withClosingIssue: boolean,
) {
    if ((await getStagedFiles()).length === 0) {
        console.log(chalk.red("No files are staged yet, add some before committing."));
        process.exit(1);
    }

    if ((await getUnmergedFiles()).length !== 0) {
        console.log(
            chalk.red("You still have unmerged files, fix and stage them before committing."),
        );
        process.exit(1);
    }

    if (!isMerge()) {
        await regularCommit(externalEditor, withIssue, withClosingIssue);
    } else {
        await mergeCommit(externalEditor);
    }
}
