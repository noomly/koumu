import { spawnSync } from "node:child_process";

import chalk from "chalk";

import { readConfig } from "@/config";
import { loopingPromptLine, promptSelect } from "@/cli/commit/prompts";
import { ghIssuesPrompt, loadGhIssues } from "@/cli/commit/ghIssues";

export default async function commit(
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
    if (kind.type === "cancel") {
        process.exit(0);
    }

    const scope = scopes.length === 0 ? undefined : await promptSelect("commit scope", scopes);
    if (scope?.type === "cancel") {
        process.exit(0);
    }

    const issue = !ghIssues ? undefined : await ghIssuesPrompt(ghIssues, withClosingIssue);
    if (issue === "error" || issue?.type === "cancel") {
        console.log(
            "Couldn't load issues from Github. Verify that you have Github's cli installed" +
                ` and are logged in (by running \`${chalk.bold("gh auth login")}\`).` +
                ` ${chalk.blue(chalk.underline("https://github.com/cli/cli#installation"))}`,
        );
        process.exit(0);
    }

    const message = externalEditor
        ? undefined
        : await loopingPromptLine("commit message", maxMessageLength, maxMessageLength - 10);
    if (message?.type === "cancel") {
        process.exit(0);
    }

    const commitMessage =
        kind.value +
        (scope ? ` ${scope.value}:` : "") +
        (message ? ` ${message.value}` : " ") +
        (issue ? `\n\n(${issue.value})` : "");

    const gitArgs = ["commit", "-m", commitMessage];

    if (externalEditor) {
        gitArgs.push("-e");
    }

    spawnSync("git", gitArgs, { stdio: "inherit" });
}