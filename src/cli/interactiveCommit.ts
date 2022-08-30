import { spawn as spawnRaw, spawnSync } from "node:child_process";

import chalk from "chalk";
import { prompt as getUserInput } from "prompts";
import { emojify } from "node-emoji";

import { Config, ConfigMap, readConfig } from "@/config";

type PromptResult =
    | {
          type: "cancel";
      }
    | {
          type: "submit";
          value: string;
      };

async function promptLine(prompt: string, length: number, warning: number): Promise<PromptResult> {
    return new Promise((resolve, reject) => {
        getUserInput(
            {
                type: "text",
                message: prompt,
                onRender() {
                    if (this._value.length === 1 && this._value === this._value.toLowerCase()) {
                        this._value = this._value.toUpperCase();
                        this.rendered = this._value;
                    }

                    if (this._value.length > length - 1) {
                        this._value = this._value.slice(0, length - 1);
                        this.rendered = this._value;
                        this.cursor = length;
                    }

                    if (this._value.length >= warning) {
                        this.rendered = `${this._value.slice(0, warning)}${chalk.red(
                            this._value.slice(warning),
                        )}`;
                    }
                },
            },
            {
                onCancel: () => {
                    resolve({ type: "cancel" });
                },
                onSubmit: (_: never, choice: string) => {
                    resolve({ type: "submit", value: choice });
                },
            },
        ).catch(reject);
    });
}

async function promptSelect(prompt: string, rawOptions: ConfigMap): Promise<PromptResult> {
    const widestOption = rawOptions
        .map(([option]) => option)
        .sort((a, b) => b.length - a.length)[0];

    const points = Object.fromEntries(
        rawOptions.map(([option]) => {
            return [option, ".".repeat(widestOption.length - option.length + 5)];
        }),
    );

    const options = rawOptions.map(([option, desc]) => {
        const emoji = emojify(option);

        return {
            title: `${option}${emoji !== option ? ` ${emoji}` : ""}${points[option]}${desc}`,
            value: `${option}`,
            desc,
        };
    });

    return new Promise((resolve, reject) => {
        getUserInput(
            {
                message: prompt,
                choices: options,
                type: "autocomplete",
                suggest: (input: string, options: [{ title: string; desc: string }]) => {
                    const lowerCaseInput = input.toLowerCase();

                    return options.filter(
                        (option) =>
                            option.desc.toLowerCase().includes(lowerCaseInput) ||
                            option.title.toLowerCase().includes(lowerCaseInput),
                    );
                },
            },
            {
                onCancel: () => {
                    resolve({ type: "cancel" });
                },
                onSubmit: (_: never, choice: string) => {
                    resolve({ type: "submit", value: choice });
                },
            },
        ).catch(reject);
    });
}

type PromiseWStatus<T> = { pending: boolean; promise: Promise<T> };
type Issue = { number: number; createdAt: string; title: string };
type IssuesResult = "error" | Issue[];

function getGhIssues(): PromiseWStatus<IssuesResult> {
    const promiseWStatus: PromiseWStatus<IssuesResult> = {
        pending: true,
        promise: new Promise<IssuesResult>((resolve) => {
            const gh = spawnRaw("gh", ["issue", "list", "--json", "number,createdAt,title"], {
                timeout: 5000,
            });

            gh.on("error", () => resolve("error"));

            gh.stderr.on("data", () => resolve("error"));

            gh.stdout.on("data", (data) => resolve(JSON.parse(data) as Issue[]));
        }).then((data) => {
            promiseWStatus.pending = false;
            return data;
        }),
    };

    return promiseWStatus;
}

export default async function commit(
    externalEditor: boolean,
    withIssue: boolean,
    withClosingIssue: boolean,
) {
    let issuesPromise: undefined | PromiseWStatus<IssuesResult>;
    let issue: undefined | PromptResult;
    if (withIssue || withClosingIssue) {
        issuesPromise = getGhIssues();
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

    if (issuesPromise) {
        if (issuesPromise.pending) {
            console.log("Loading github issues...");
        }

        const issues = await issuesPromise.promise;

        if (issues !== "error") {
            issue = await promptSelect(
                `${withClosingIssue ? "closes " : ""}issue`,
                [...issues.values()].map(({ number, title }) => [`#${number}`, title]),
            );

            if (issue.type === "cancel") {
                process.exit(0);
            }
        } else {
            console.log(
                "Couldn't load issues from Github. Verify that you have Github's cli installed" +
                    ` and are logged in (by running \`${chalk.bold("gh auth login")}\`).` +
                    ` ${chalk.blue(chalk.underline("https://github.com/cli/cli#installation"))}`,
            );
        }
    }

    let message: undefined | PromptResult;
    if (!externalEditor) {
        while (!message || (message.type === "submit" && message.value.length === 0)) {
            message = await promptLine("commit message", maxMessageLength, maxMessageLength - 10);
        }

        if (message?.type === "cancel") {
            process.exit(0);
        }
    }

    const commitMessage =
        kind.value +
        (scope ? ` ${scope.value}:` : "") +
        (message && message.type === "submit" ? ` ${message.value}` : " ") +
        (issue && issue.type === "submit"
            ? `\n\n(${withClosingIssue ? "Closes " : ""}${issue.value})`
            : " ");

    const gitArgs = ["commit", "-m", commitMessage];

    if (externalEditor) {
        gitArgs.push("-e");
    }

    spawnSync("git", gitArgs, { stdio: "inherit" });
}
